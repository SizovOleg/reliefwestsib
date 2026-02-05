"""
GeoServer REST API helper functions.
"""

import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_auth():
    """Get HTTP Basic Auth for GeoServer."""
    return HTTPBasicAuth(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD)


def get_base_url():
    """Get GeoServer REST API base URL."""
    return f"{settings.GEOSERVER_URL}/rest"


def ensure_workspace_exists(workspace=None):
    """
    Ensure the workspace exists in GeoServer.
    """
    workspace = workspace or settings.GEOSERVER_WORKSPACE
    url = f"{get_base_url()}/workspaces/{workspace}.json"
    
    resp = requests.get(url, auth=get_auth())
    if resp.status_code == 200:
        logger.info(f"Workspace '{workspace}' exists")
        return True
    
    # Create workspace
    create_url = f"{get_base_url()}/workspaces"
    data = {"workspace": {"name": workspace}}
    resp = requests.post(create_url, json=data, auth=get_auth())
    
    if resp.status_code in (200, 201):
        logger.info(f"Workspace '{workspace}' created")
        return True
    else:
        logger.error(f"Failed to create workspace: {resp.text}")
        return False


def ensure_datastore_exists(store_name='postgis', workspace=None):
    """
    Ensure PostGIS datastore exists in GeoServer.
    """
    workspace = workspace or settings.GEOSERVER_WORKSPACE
    url = f"{get_base_url()}/workspaces/{workspace}/datastores/{store_name}.json"
    
    resp = requests.get(url, auth=get_auth())
    if resp.status_code == 200:
        logger.info(f"Datastore '{store_name}' exists")
        return True
    
    # Create datastore
    create_url = f"{get_base_url()}/workspaces/{workspace}/datastores"
    db = settings.DATABASES['default']
    
    data = {
        "dataStore": {
            "name": store_name,
            "type": "PostGIS",
            "connectionParameters": {
                "entry": [
                    {"@key": "host", "$": db['HOST']},
                    {"@key": "port", "$": db['PORT']},
                    {"@key": "database", "$": db['NAME']},
                    {"@key": "user", "$": db['USER']},
                    {"@key": "passwd", "$": db['PASSWORD']},
                    {"@key": "dbtype", "$": "postgis"},
                    {"@key": "schema", "$": "public"},
                ]
            }
        }
    }
    
    resp = requests.post(create_url, json=data, auth=get_auth())
    
    if resp.status_code in (200, 201):
        logger.info(f"Datastore '{store_name}' created")
        return True
    else:
        logger.error(f"Failed to create datastore: {resp.text}")
        return False


def publish_postgis_layer(table_name, layer_title=None, workspace=None, store_name='postgis'):
    """
    Publish a PostGIS table as a layer in GeoServer.
    
    Args:
        table_name: Name of the table in PostGIS
        layer_title: Human-readable title (defaults to table_name)
        workspace: GeoServer workspace
        store_name: GeoServer datastore name
    
    Returns:
        dict with 'success' and 'message' keys
    """
    workspace = workspace or settings.GEOSERVER_WORKSPACE
    layer_title = layer_title or table_name
    
    # Ensure workspace and datastore exist
    if not ensure_workspace_exists(workspace):
        return {'success': False, 'message': 'Failed to ensure workspace exists'}
    
    if not ensure_datastore_exists(store_name, workspace):
        return {'success': False, 'message': 'Failed to ensure datastore exists'}
    
    # Check if layer already exists
    layer_url = f"{get_base_url()}/workspaces/{workspace}/datastores/{store_name}/featuretypes/{table_name}.json"
    resp = requests.get(layer_url, auth=get_auth())
    
    if resp.status_code == 200:
        logger.info(f"Layer '{table_name}' already exists, updating...")
        # Update existing layer
        data = {
            "featureType": {
                "name": table_name,
                "title": layer_title,
                "enabled": True,
                "srs": "EPSG:4326",
            }
        }
        resp = requests.put(layer_url, json=data, auth=get_auth())
        if resp.status_code in (200, 201):
            return {'success': True, 'message': f'Layer {table_name} updated'}
        else:
            return {'success': False, 'message': f'Failed to update layer: {resp.text}'}
    
    # Create new layer
    create_url = f"{get_base_url()}/workspaces/{workspace}/datastores/{store_name}/featuretypes"
    data = {
        "featureType": {
            "name": table_name,
            "nativeName": table_name,
            "title": layer_title,
            "enabled": True,
            "srs": "EPSG:4326",
        }
    }
    
    resp = requests.post(create_url, json=data, auth=get_auth())
    
    if resp.status_code in (200, 201):
        logger.info(f"Layer '{table_name}' published successfully")
        return {'success': True, 'message': f'Layer {table_name} published'}
    else:
        logger.error(f"Failed to publish layer: {resp.text}")
        return {'success': False, 'message': f'Failed to publish: {resp.text}'}


def delete_layer(layer_name, workspace=None, store_name='postgis'):
    """
    Delete a layer from GeoServer.
    """
    workspace = workspace or settings.GEOSERVER_WORKSPACE
    
    # Delete feature type
    url = f"{get_base_url()}/workspaces/{workspace}/datastores/{store_name}/featuretypes/{layer_name}?recurse=true"
    resp = requests.delete(url, auth=get_auth())
    
    if resp.status_code in (200, 204):
        logger.info(f"Layer '{layer_name}' deleted")
        return {'success': True, 'message': f'Layer {layer_name} deleted'}
    else:
        logger.error(f"Failed to delete layer: {resp.text}")
        return {'success': False, 'message': f'Failed to delete: {resp.text}'}


def get_layer_info(layer_name, workspace=None):
    """
    Get layer information from GeoServer.
    """
    workspace = workspace or settings.GEOSERVER_WORKSPACE
    url = f"{get_base_url()}/workspaces/{workspace}/layers/{layer_name}.json"
    
    resp = requests.get(url, auth=get_auth())
    
    if resp.status_code == 200:
        return resp.json()
    return None
