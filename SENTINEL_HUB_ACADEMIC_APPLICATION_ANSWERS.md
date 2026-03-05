# Sentinel Hub Academic Account Application - Answers

## 1. Project Objectives

SkyCrop is an AI-powered satellite-based agricultural monitoring platform designed to empower small-scale paddy farmers in Sri Lanka with precision agriculture capabilities. The project leverages Sentinel-2 satellite imagery and machine learning to provide real-time crop health monitoring, yield predictions, and data-driven farming recommendations.

The project will deliver an automated field monitoring system that calculates vegetation indices (NDVI, NDWI, TDVI) from Sentinel-2 multispectral imagery to assess crop health, an AI-powered yield prediction model (Random Forest) achieving ≥85% accuracy for better market planning, precision agriculture recommendations for irrigation and fertilization, automated disaster impact assessment quantifying crop damage from floods and droughts, and a deep learning model (U-Net) for automated field boundary extraction.

Expected benefits include 15-25% yield increase, 20-30% reduction in water costs, and 15-20% reduction in fertilizer costs for farmers, enhanced food security and environmental sustainability for the agricultural sector, and open-source contributions to precision agriculture research. Primary beneficiaries are small to medium-scale paddy farmers (0.5-5 hectares) in Sri Lanka, with secondary benefits for agricultural extension services, insurance companies, research institutions, and policy makers.

Results will be published in academic journals and presented at conferences, core algorithms will be open-sourced (MIT License), the platform will be deployed as a free service for 100 farmers in Year 1, and all outputs will include proper attribution to Sentinel Hub and Copernicus data sources.

---

## 2. Implementation Methodology

**Implementation Approach:**

The project follows a microservices architecture with three main components:

1. **Backend API Service** (Node.js/Express):
   - Integrates with Sentinel Hub Process API to retrieve Sentinel-2 L2A imagery
   - Processes multispectral bands (B02, B03, B04, B08, B11) for vegetation index calculations
   - Implements cloud masking (rejecting images with >20% cloud cover)
   - Caches processed imagery for 30 days to minimize API calls
   - Provides RESTful APIs for field management, health monitoring, and recommendations

2. **ML Service** (Python/Flask):
   - Field boundary detection using U-Net deep learning model (trained on Sentinel-2 imagery)
   - Yield prediction using Random Forest regression model
   - Disaster impact analysis through temporal image comparison
   - ONNX model format for production deployment

3. **Training Pipeline** (Python/TensorFlow):
   - Automated data preprocessing from Sentinel-2 NetCDF/GeoTIFF formats
   - Model training with validation and early stopping
   - Model export to ONNX for cross-platform deployment

**Data Processing Workflow:**
1. **Image Retrieval**: Request Sentinel-2 L2A imagery for field boundaries (512×512 pixels, 10m resolution) via Sentinel Hub Process API
2. **Cloud Filtering**: Filter images with <20% cloud cover using Scene Classification Layer (SCL)
3. **Index Calculation**: Compute NDVI, NDWI, TDVI from multispectral bands
4. **Temporal Analysis**: Compare current indices with historical data to detect trends and anomalies
5. **ML Inference**: Apply trained models for boundary detection and yield prediction
6. **Caching Strategy**: Store processed results in Redis (24h TTL) and PostgreSQL for historical tracking

**Justification for Sentinel-2 Data:**
- **Free and Open Access**: Sentinel-2 data is freely available through Copernicus program, making it ideal for academic research
- **Suitable Resolution**: 10m spatial resolution is optimal for paddy field monitoring (fields typically 0.5-5 hectares)
- **Multispectral Bands**: Required bands (Red, NIR, SWIR) are available in Sentinel-2 L2A for accurate vegetation index calculation
- **Temporal Frequency**: 5-day revisit time enables near-real-time monitoring of crop health changes
- **Atmospheric Correction**: L2A products are atmospherically corrected, reducing preprocessing complexity

**Estimated Data Usage:**
- **Geographical Coverage**: Sri Lanka (65,610 km² total area)
- **Focus Area**: Paddy cultivation regions (~500,000 hectares)
- **Per-Field Coverage**: Average field size 1 hectare, requiring ~1 km² imagery per field
- **Monthly Usage**: ~3,000 API requests/month (academic tier limit) for 100 farmers × 1 field × 1 image/month
- **Total Area**: ~100 km²/month (well within academic tier limits)

**Single User License Justification:**
Only one user license is requested as this is a single-student Final Year Project (FYP). The account will be used exclusively for:
- Development and testing of the SkyCrop platform
- Academic research and thesis work
- Pilot deployment for 100 farmers (research phase)
- No commercial use during the academic period

---

## 3. Results

**Generated Results:**

1. **Vegetation Index Maps**:
   - Format: GeoTIFF raster files (10m resolution)
   - Content: NDVI, NDWI, TDVI indices calculated from Sentinel-2 bands
   - Metadata: Acquisition date, cloud cover percentage, field ID, processing timestamp
   - Storage: PostgreSQL database with spatial indexing (PostGIS)

2. **Crop Health Reports**:
   - Format: JSON API responses and PDF reports
   - Content: Health scores (0-100), trend analysis (improving/declining/stable), anomaly detection with severity classification
   - Temporal Coverage: Historical time-series data with 5-day intervals
   - Visualization: Interactive maps and charts in web/mobile interfaces

3. **Yield Predictions**:
   - Format: JSON with confidence intervals (lower/upper bounds)
   - Content: Predicted yield (kg/hectare), revenue estimation, harvest date estimation
   - Accuracy Metrics: Model performance statistics (RMSE, R², MAE)

4. **Field Boundary Polygons**:
   - Format: GeoJSON polygons
   - Content: Automated field boundaries extracted using U-Net segmentation
   - Accuracy: Validated against manually digitized boundaries

5. **Disaster Impact Assessments**:
   - Format: JSON reports with quantified damage metrics
   - Content: Affected area (hectares), damage severity classification, before/after comparison images
   - Use Case: Insurance claims support, disaster response planning

6. **Research Publications**:
   - Format: Academic papers (PDF)
   - Topics: Precision agriculture applications, ML model performance, satellite imagery processing methodologies
   - Venues: Agricultural technology conferences, remote sensing journals

**Public Availability (Research & Education Project):**

Yes, results will be made available to the public in the following forms:

1. **Open Source Code**: 
   - GitHub repository (MIT License)
   - Core algorithms, API implementations, ML training pipelines
   - Documentation and usage guides

2. **Academic Publications**:
   - Conference papers and journal articles
   - Methodology documentation
   - Performance benchmarks and validation results

3. **Public Platform Access**:
   - Free web and mobile application for farmers (during research phase)
   - Public API documentation
   - Case studies and success stories

4. **Data Sharing**:
   - Aggregated, anonymized statistics (no individual farmer data)
   - Model performance metrics
   - Validation datasets (with proper data use agreements)

**Attribution:**
All results will include proper attribution: "Contains modified Copernicus Sentinel data [year], processed via Sentinel Hub"

---

## 4. Justification for Selected Service(s) and Provider

**Why Sentinel Hub:**

1. **Academic Support Program**:
   - Sentinel Hub offers a dedicated academic tier with 3,000 free requests/month, which is ideal for research projects
   - Clear academic application process with educational focus
   - No commercial restrictions during research phase

2. **Technical Advantages**:
   - **Process API**: Direct access to processed Sentinel-2 L2A imagery without requiring local data download and preprocessing
   - **Custom Eval Scripts**: Ability to request specific band combinations and vegetation indices directly, reducing backend processing load
   - **Cloud Masking**: Built-in cloud detection and filtering capabilities
   - **Reliable Infrastructure**: 99.9% uptime SLA ensures consistent data availability for research

3. **Developer Experience**:
   - Well-documented REST API with comprehensive examples
   - OAuth 2.0 authentication (secure and standard)
   - Multiple output formats (GeoTIFF, PNG) suitable for different use cases
   - Active community support and documentation

4. **Cost-Effectiveness**:
   - Free academic tier sufficient for research phase (100 farmers, ~3,000 requests/month)
   - No infrastructure costs for data storage and processing
   - Pay-as-you-grow model if scaling beyond academic tier

**Comparison with Alternatives:**

1. **Google Earth Engine**:
   - **Why Not**: Requires more complex setup, primarily JavaScript-based API (our stack is Node.js/Python), less direct control over processing parameters
   - **Sentinel Hub Advantage**: More straightforward REST API, better suited for microservices architecture

2. **Copernicus Open Access Hub (Direct Download)**:
   - **Why Not**: Requires downloading entire scenes (hundreds of MB), local storage infrastructure, manual atmospheric correction
   - **Sentinel Hub Advantage**: On-demand processing, only download what's needed, pre-processed L2A data

3. **Planet Labs**:
   - **Why Not**: Commercial pricing, limited free tier, primarily commercial satellite data
   - **Sentinel Hub Advantage**: Free academic access, Sentinel-2 data (open and free)

4. **AWS Earth Observation**:
   - **Why Not**: More complex pricing model, requires AWS infrastructure setup, primarily for large-scale commercial use
   - **Sentinel Hub Advantage**: Simpler pricing, academic-friendly, purpose-built for research

**Conclusion:**
Sentinel Hub is the optimal choice for this academic research project due to its dedicated academic support, technical capabilities, cost-effectiveness, and alignment with our microservices architecture.

---

## 5. Description of Work Within Cloud Environment

**Cloud Processing Workflow:**

The project utilizes Sentinel Hub's cloud processing capabilities for the following operations:

1. **On-Demand Image Processing**:
   - Submit processing requests via Sentinel Hub Process API with custom evalscript
   - Request specific multispectral bands (B02, B03, B04, B08, B11) for vegetation index calculations
   - Apply cloud masking using Scene Classification Layer (SCL) during processing
   - Receive processed GeoTIFF images directly, eliminating need for local atmospheric correction

2. **Spatial Processing**:
   - Request imagery for specific bounding boxes (field boundaries + 100m buffer)
   - Resample to consistent 10m resolution
   - Crop to field boundaries to reduce data transfer and processing time

3. **Temporal Processing**:
   - Query catalog API to find available images within date ranges
   - Select images with <20% cloud cover automatically
   - Request historical imagery for trend analysis and disaster comparison

4. **Band Combination Processing**:
   - Custom evalscript to combine multiple bands for RGB visualization
   - Calculate vegetation indices (NDVI, NDWI, TDVI) server-side when possible
   - Apply normalization and scaling (0-1 range) during processing

**Benefits of Cloud Processing:**

- **No Local Storage**: Eliminates need for terabytes of local Sentinel-2 data storage
- **Reduced Bandwidth**: Only download processed results (512×512 tiles) instead of full scenes
- **Faster Processing**: Leverage Sentinel Hub's optimized processing infrastructure
- **Scalability**: Handle multiple concurrent requests without local resource constraints
- **Cost Efficiency**: Pay only for processed data, not storage of raw imagery

**Workflow Example:**
```
1. User requests field health data for Field ID 123 on 2025-01-15
2. Backend constructs Process API request:
   - Bounding box: Field boundary coordinates
   - Date: 2025-01-15
   - Bands: B02, B03, B04, B08, B11
   - Resolution: 10m
   - Cloud filter: <20%
3. Sentinel Hub processes request in cloud:
   - Retrieves Sentinel-2 L2A scene
   - Applies cloud masking
   - Extracts requested bands
   - Crops to bounding box
   - Returns GeoTIFF
4. Backend receives processed image (~500KB)
5. Backend calculates vegetation indices locally
6. Results cached in Redis for 24 hours
```

**Estimated Cloud Usage:**
- **Requests/Month**: ~3,000 (academic tier limit)
- **Average Request Size**: 512×512 pixels, 5 bands = ~500KB per response
- **Total Data Transfer**: ~1.5GB/month (well within limits)
- **Processing Time**: ~2-5 seconds per request (handled by Sentinel Hub)

---

## 6. Geographical Area of Interest

**Primary Geographic Focus:**

**Country**: Sri Lanka

**Specific Regions of Interest:**

1. **North Central Province**:
   - Major paddy cultivation area (Anuradhapura, Polonnaruwa districts)
   - Coordinates: ~7.5°N to 8.5°N, 80.5°E to 81.5°E
   - Estimated coverage: ~150,000 hectares of paddy fields

2. **Eastern Province**:
   - Significant paddy production (Batticaloa, Ampara districts)
   - Coordinates: ~7.0°N to 8.0°N, 81.0°E to 81.8°E
   - Estimated coverage: ~100,000 hectares

3. **North Western Province**:
   - Paddy cultivation regions (Kurunegala, Puttalam districts)
   - Coordinates: ~7.2°N to 8.0°N, 79.8°E to 80.5°E
   - Estimated coverage: ~80,000 hectares

4. **Southern Province**:
   - Paddy farming areas (Hambantota, Matara districts)
   - Coordinates: ~5.9°N to 6.5°N, 80.2°E to 81.0°E
   - Estimated coverage: ~60,000 hectares

5. **Central Province**:
   - Upland paddy cultivation (Kandy, Matale districts)
   - Coordinates: ~7.0°N to 7.5°N, 80.5°E to 80.8°E
   - Estimated coverage: ~40,000 hectares

**Total Area of Interest:**
- **Country Coverage**: Entire Sri Lanka (65,610 km²)
- **Paddy Field Focus**: ~500,000 hectares of paddy cultivation
- **Pilot Phase Coverage**: 100 fields (~100 hectares) in Year 1
- **Scaling Plan**: Expand to 1,000 fields (~1,000 hectares) in Year 2-3

**Bounding Box Coordinates (Sri Lanka):**
- **North**: 9.8°N
- **South**: 5.9°N
- **East**: 81.9°E
- **West**: 79.7°E

**Justification for Geographic Scope:**

1. **Research Focus**: Sri Lanka is the primary research area for this Final Year Project, focusing on local paddy farming challenges
2. **Data Availability**: Sentinel-2 provides excellent coverage of Sri Lanka with frequent revisits (5-day cycle)
3. **Agricultural Significance**: Paddy is a staple crop in Sri Lanka, with 1.8 million farmers managing over 1 million hectares
4. **Climate Relevance**: Sri Lanka's tropical climate and monsoon patterns make it an ideal case study for satellite-based crop monitoring
5. **Scalability**: Results can be extended to other South Asian countries with similar agricultural practices

**Sentinel-2 Tile Coverage:**
- Primary tiles covering Sri Lanka: 44QPK, 44QPL, 44QPM, 44QPN, 44QQL, 44QQM, 44QQN
- All tiles are regularly covered by Sentinel-2 constellation
- No data gaps expected for the research period

---

## Additional Notes for Application

**Project Type**: Final Year Project (FYP) / Undergraduate Research

**Institution**: [Your University Name]

**Supervisor**: [Supervisor Name, if applicable]

**Expected Completion**: [Your project timeline, e.g., February 2026]

**Data Usage Ethics**: 
- All farmer data will be anonymized
- No commercial use during academic period
- Proper attribution to Copernicus and Sentinel Hub in all outputs

**Contact Information**:
- Student Email: [Your email]
- University Email: [University email if required]
- Project Repository: [GitHub link if available]

---

**Good luck with your application!** 🚀
