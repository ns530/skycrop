"""
Google Earth Engine Indices Computation
Provides NDVI, NDWI, and TDVI calculations as alternative to SentinelHub
"""

import os
import json
import logging
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Try to import earthengine, but make it optional
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False
    logger.warning("Google Earth Engine not installed. Install with: pip install earthengine-api")


def initialize_gee() -> bool:
    """Initialize Google Earth Engine with authentication"""
    if not GEE_AVAILABLE:
        return False
    
    try:
        # Check if already initialized
        if hasattr(ee, '_initialized') and ee._initialized:
            return True
        
        # Try to initialize
        # Option 1: Service account (recommended for production)
        service_account = os.getenv('GEE_SERVICE_ACCOUNT')
        service_key_path = os.getenv('GEE_SERVICE_KEY_PATH')
        
        if service_account and service_key_path:
            credentials = ee.ServiceAccountCredentials(service_account, service_key_path)
            ee.Initialize(credentials)
        else:
            # Option 2: User authentication (for development)
            # User needs to run: earthengine authenticate
            ee.Initialize()
        
        logger.info("Google Earth Engine initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Google Earth Engine: {e}")
        logger.error("To set up GEE:")
        logger.error("1. Install: pip install earthengine-api")
        logger.error("2. Authenticate: earthengine authenticate")
        logger.error("3. Or set GEE_SERVICE_ACCOUNT and GEE_SERVICE_KEY_PATH")
        return False


def compute_indices(geometry: Dict[str, Any], date: str) -> Dict[str, Optional[float]]:
    """
    Compute NDVI, NDWI, and TDVI indices for a field using Google Earth Engine
    
    Args:
        geometry: GeoJSON geometry object
        date: Date in YYYY-MM-DD format
        
    Returns:
        Dictionary with ndvi, ndwi, tdvi values (or None if computation fails)
    """
    if not GEE_AVAILABLE:
        raise RuntimeError("Google Earth Engine is not installed. Install with: pip install earthengine-api")
    
    if not initialize_gee():
        raise RuntimeError("Failed to initialize Google Earth Engine. Check authentication.")
    
    try:
        # Convert date to datetime range
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        date_start = date_obj.strftime('%Y-%m-%d')
        date_end = (date_obj + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Load Sentinel-2 Surface Reflectance collection
        collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterDate(date_start, date_end) \
            .filterBounds(ee.Geometry(geometry)) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))  # Filter cloudy images
        
        # Get the first (least cloudy) image
        image = collection.first()
        
        # Check if image exists
        try:
            image_id = image.get('system:index').getInfo()
            if not image_id:
                logger.warning(f"No Sentinel-2 image found for date {date}")
                return {'ndvi': None, 'ndwi': None, 'tdvi': None}
        except Exception:
            logger.warning(f"No Sentinel-2 image found for date {date}")
            return {'ndvi': None, 'ndwi': None, 'tdvi': None}
        
        # Select bands
        # Sentinel-2 bands: B2=Blue, B3=Green, B4=Red, B8=NIR
        nir = image.select('B8')
        red = image.select('B4')
        green = image.select('B3')
        
        # Calculate indices
        # NDVI = (NIR - RED) / (NIR + RED)
        ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
        
        # NDWI = (GREEN - NIR) / (GREEN + NIR)
        ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI')
        
        # TDVI = (NIR - RED) / sqrt(NIR + RED)
        tdvi = nir.subtract(red).divide(nir.add(red).sqrt()).rename('TDVI')
        
        # Convert geometry to EE Geometry
        geometry_ee = ee.Geometry(geometry)
        
        # Calculate mean values over the geometry
        # Use scale=10 meters (Sentinel-2 native resolution)
        ndvi_stats = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9,
            bestEffort=True
        )
        
        ndwi_stats = ndwi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9,
            bestEffort=True
        )
        
        tdvi_stats = tdvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9,
            bestEffort=True
        )
        
        # Get values (this triggers the computation)
        ndvi_mean = ndvi_stats.get('NDVI').getInfo()
        ndwi_mean = ndwi_stats.get('NDWI').getInfo()
        tdvi_mean = tdvi_stats.get('TDVI').getInfo()
        
        # Handle None values
        result = {
            'ndvi': float(ndvi_mean) if ndvi_mean is not None else None,
            'ndwi': float(ndwi_mean) if ndwi_mean is not None else None,
            'tdvi': float(tdvi_mean) if tdvi_mean is not None else None,
        }
        
        logger.info(f"Computed indices for date {date}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error computing indices with Google Earth Engine: {e}", exc_info=True)
        raise RuntimeError(f"GEE computation failed: {str(e)}")


def is_available() -> bool:
    """Check if Google Earth Engine is available and configured"""
    if not GEE_AVAILABLE:
        return False
    return initialize_gee()
