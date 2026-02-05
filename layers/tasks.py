"""
Celery tasks for layer import and publishing.
"""

import os
import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def import_layer_task(self, layer_id):
    """
    Background task to import a layer file into PostGIS and publish to GeoServer.
    
    Args:
        layer_id: ID of the Layer model instance
    """
    from .models import Layer
    from .import_utils import import_layer_file, get_table_columns
    from .geoserver_api import publish_postgis_layer
    
    try:
        layer = Layer.objects.get(pk=layer_id)
    except Layer.DoesNotExist:
        logger.error(f"Layer {layer_id} not found")
        return {'success': False, 'message': 'Layer not found'}
    
    # Check if source file exists
    if not layer.source_file:
        return {'success': False, 'message': 'No source file'}
    
    file_path = layer.source_file.path
    if not os.path.exists(file_path):
        return {'success': False, 'message': f'File not found: {file_path}'}
    
    # Generate table name from slug
    table_name = layer.slug.replace('-', '_')
    
    logger.info(f"Starting import for layer '{layer.title}' -> table '{table_name}'")
    
    # Step 1: Import to PostGIS
    result = import_layer_file(file_path, table_name)
    
    if not result['success']:
        logger.error(f"Import failed: {result['message']}")
        return result
    
    # Step 2: Update layer model with metadata
    layer.postgis_table = table_name
    layer.feature_count = result['feature_count']
    
    # Convert geometry type
    geom_type_map = {
        'POINT': 'point',
        'MULTIPOINT': 'point',
        'LINESTRING': 'line',
        'MULTILINESTRING': 'line',
        'POLYGON': 'polygon',
        'MULTIPOLYGON': 'polygon',
    }
    geom_type = result.get('geom_type', '').upper()
    layer.geom_type = geom_type_map.get(geom_type, 'multi')
    
    # Set bbox
    bbox = result.get('bbox')
    if bbox:
        layer.bbox_west = bbox['west']
        layer.bbox_south = bbox['south']
        layer.bbox_east = bbox['east']
        layer.bbox_north = bbox['north']
    
    layer.save()
    
    # Step 3: Create LayerAttribute entries for columns
    from .models import LayerAttribute
    
    columns = result.get('columns', [])
    for i, col in enumerate(columns):
        LayerAttribute.objects.update_or_create(
            layer=layer,
            field_name=col['name'],
            defaults={
                'display_name': col['name'].replace('_', ' ').title(),
                'show_in_popup': True,
                'sort_order': i,
            }
        )
    
    # Step 4: Publish to GeoServer
    workspace = settings.GEOSERVER_WORKSPACE
    gs_result = publish_postgis_layer(
        table_name=table_name,
        layer_title=layer.title,
        workspace=workspace
    )
    
    if gs_result['success']:
        layer.geoserver_layer_name = f"{workspace}:{table_name}"
        layer.save()
        logger.info(f"Layer '{layer.title}' published to GeoServer as {layer.geoserver_layer_name}")
    else:
        logger.warning(f"GeoServer publish failed: {gs_result['message']}")
        # Don't fail the whole task - PostGIS import was successful
    
    return {
        'success': True,
        'message': f"Imported {result['feature_count']} features",
        'feature_count': result['feature_count'],
        'geom_type': layer.geom_type,
        'geoserver': gs_result['success'],
        'geoserver_layer': layer.geoserver_layer_name,
    }


@shared_task
def delete_layer_data_task(table_name, geoserver_layer_name=None):
    """
    Background task to delete layer data from PostGIS and GeoServer.
    
    Args:
        table_name: PostGIS table name
        geoserver_layer_name: Full layer name (workspace:layer)
    """
    from .import_utils import drop_table
    from .geoserver_api import delete_layer
    
    results = {}
    
    # Delete from GeoServer
    if geoserver_layer_name and ':' in geoserver_layer_name:
        workspace, layer_name = geoserver_layer_name.split(':', 1)
        gs_result = delete_layer(layer_name, workspace)
        results['geoserver'] = gs_result
    
    # Drop PostGIS table
    if table_name:
        pg_result = drop_table(table_name)
        results['postgis'] = pg_result
    
    return results
