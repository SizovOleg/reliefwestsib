"""
Layer import utilities.
Uses ogr2ogr for importing vector data into PostGIS.
"""

import os
import subprocess
import tempfile
import zipfile
import shutil
from pathlib import Path
from django.conf import settings
from django.db import connection
import logging

logger = logging.getLogger(__name__)


def extract_shapefile(zip_path, extract_dir):
    """
    Extract a zipped shapefile and return path to .shp file.
    """
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(extract_dir)
    
    # Find .shp file
    for root, dirs, files in os.walk(extract_dir):
        for f in files:
            if f.lower().endswith('.shp'):
                return os.path.join(root, f)
    
    raise ValueError("No .shp file found in archive")


def get_file_type(file_path):
    """
    Detect file type based on extension.
    """
    ext = Path(file_path).suffix.lower()
    
    if ext == '.zip':
        return 'shapefile_zip'
    elif ext == '.shp':
        return 'shapefile'
    elif ext in ('.geojson', '.json'):
        return 'geojson'
    elif ext in ('.gpkg',):
        return 'geopackage'
    elif ext in ('.tif', '.tiff'):
        return 'geotiff'
    else:
        return 'unknown'


def import_vector_to_postgis(source_path, table_name, srid=4326):
    """
    Import vector data into PostGIS using ogr2ogr.
    
    Args:
        source_path: Path to source file (shapefile, geojson, etc.)
        table_name: Name for the new PostGIS table
        srid: Target SRID (default 4326)
    
    Returns:
        dict with 'success', 'message', 'feature_count', 'geom_type'
    """
    db = settings.DATABASES['default']
    
    # Build connection string
    pg_conn = f"PG:host={db['HOST']} port={db['PORT']} dbname={db['NAME']} user={db['USER']} password={db['PASSWORD']}"
    
    # Build ogr2ogr command
    cmd = [
        '/usr/bin/ogr2ogr',
        '-f', 'PostgreSQL',
        pg_conn,
        source_path,
        '-nln', table_name,           # New layer name
        '-nlt', 'PROMOTE_TO_MULTI',   # Handle mixed geometries
        '-t_srs', f'EPSG:{srid}',     # Target SRS
        '-lco', 'GEOMETRY_NAME=geom', # Geometry column name
        '-lco', 'FID=gid',            # Feature ID column
        '-lco', 'PRECISION=NO',       # Don't limit precision
        '-overwrite',                 # Overwrite if exists
        '--config', 'PG_USE_COPY', 'YES',  # Use COPY for speed
    ]
    
    logger.info(f"Running ogr2ogr: {' '.join(cmd[:6])}...")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"ogr2ogr failed: {result.stderr}")
            return {
                'success': False,
                'message': f"ogr2ogr error: {result.stderr}",
                'feature_count': 0,
                'geom_type': None
            }
        
        # Get feature count and geometry type
        with connection.cursor() as cursor:
            # Feature count
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            feature_count = cursor.fetchone()[0]
            
            # Geometry type
            cursor.execute(f'''
                SELECT GeometryType(geom) 
                FROM "{table_name}" 
                WHERE geom IS NOT NULL 
                LIMIT 1
            ''')
            row = cursor.fetchone()
            geom_type = row[0] if row else 'UNKNOWN'
        
        logger.info(f"Imported {feature_count} features, type: {geom_type}")
        
        return {
            'success': True,
            'message': f"Successfully imported {feature_count} features",
            'feature_count': feature_count,
            'geom_type': geom_type
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'message': "Import timed out (>5 minutes)",
            'feature_count': 0,
            'geom_type': None
        }
    except Exception as e:
        logger.exception("Import failed")
        return {
            'success': False,
            'message': str(e),
            'feature_count': 0,
            'geom_type': None
        }


def get_table_bbox(table_name):
    """
    Get bounding box of a PostGIS table.
    
    Returns:
        dict with west, south, east, north or None
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'''
                SELECT 
                    ST_XMin(ST_Extent(geom)) as west,
                    ST_YMin(ST_Extent(geom)) as south,
                    ST_XMax(ST_Extent(geom)) as east,
                    ST_YMax(ST_Extent(geom)) as north
                FROM "{table_name}"
            ''')
            row = cursor.fetchone()
            if row and row[0] is not None:
                return {
                    'west': row[0],
                    'south': row[1],
                    'east': row[2],
                    'north': row[3]
                }
    except Exception as e:
        logger.error(f"Failed to get bbox: {e}")
    
    return None


def get_table_columns(table_name):
    """
    Get column names and types from a PostGIS table.
    
    Returns:
        list of dicts with 'name' and 'type'
    """
    columns = []
    try:
        with connection.cursor() as cursor:
            cursor.execute('''
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = %s 
                AND column_name NOT IN ('gid', 'geom')
                ORDER BY ordinal_position
            ''', [table_name])
            
            for row in cursor.fetchall():
                columns.append({
                    'name': row[0],
                    'type': row[1]
                })
    except Exception as e:
        logger.error(f"Failed to get columns: {e}")
    
    return columns


def drop_table(table_name):
    """
    Drop a PostGIS table.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
        logger.info(f"Table '{table_name}' dropped")
        return True
    except Exception as e:
        logger.error(f"Failed to drop table: {e}")
        return False


def import_layer_file(file_path, table_name):
    """
    High-level function to import a layer file.
    Handles zipped shapefiles, geojson, etc.
    
    Returns:
        dict with import results
    """
    file_type = get_file_type(file_path)
    temp_dir = None
    source_path = file_path
    
    try:
        if file_type == 'shapefile_zip':
            # Extract to temp directory
            temp_dir = tempfile.mkdtemp()
            source_path = extract_shapefile(file_path, temp_dir)
            logger.info(f"Extracted shapefile to: {source_path}")
        
        elif file_type == 'unknown':
            return {
                'success': False,
                'message': f"Unknown file type: {Path(file_path).suffix}",
                'feature_count': 0,
                'geom_type': None
            }
        
        # Import to PostGIS
        result = import_vector_to_postgis(source_path, table_name)
        
        # Add bbox if successful
        if result['success']:
            result['bbox'] = get_table_bbox(table_name)
            result['columns'] = get_table_columns(table_name)
        
        return result
        
    finally:
        # Cleanup temp directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
