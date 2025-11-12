# OpenAPI Sprint 2 Patch — Unified Diff

Unified diff to update OpenAPI for Sprint 2 against [`openapi.yaml`](backend/src/api/openapi.yaml).

Notes for reviewer:
- Introduces spatial filters on GET /api/v1/fields
- Defines PATCH on /api/v1/fields/{id} (metadata only)
- Adds Satellite endpoints (tiles, preprocess) and ML Gateway endpoint (segmentation predict)
- Adds new component schemas: GeoJSONPolygon, Field, FieldCreateRequest, ErrorResponse, TileResponse (headers-focused), MLMaskResponse
- Security scheme bearerAuth already exists

Apply with care; validate with an OpenAPI linter after patching.

```diff
--- a/backend/src/api/openapi.yaml
+++ b/backend/src/api/openapi.yaml
@@ -200,17 +200,78 @@
   /api/v1/fields:
-    get:
-      tags: [Fields]
-      summary: List user's fields
-      description: Returns all active fields owned by the authenticated user
-      security:
-        - bearerAuth: []
-      responses:
-        '200':
-          description: List of fields
-          content:
-            application/json:
-              schema:
-                type: object
-                properties:
-                  success:
-                    type: boolean
-                    example: true
-                  data:
-                    type: array
-                    items:
-                      type: object
-                      properties:
-                        field_id:
-                          type: string
-                          format: uuid
-                        user_id:
-                          type: string
-                          format: uuid
-                        name:
-                          type: string
-                        boundary:
-                          type: object
-                          description: GeoJSON Polygon
-                        area:
-                          type: number
-                          format: float
-                          description: Area in hectares
-                        center:
-                          type: object
-                          description: GeoJSON Point
-                        status:
-                          type: string
-                          enum: [active, archived, deleted]
-                        created_at:
-                          type: string
-                          format: date-time
-                        updated_at:
-                          type: string
-                          format: date-time
-                required: [success, data]
-        '401':
-          description: Unauthorized
-          content:
-            application/json:
-              schema:
-                $ref: '#/components/schemas/Error'
+    get:
+      tags: [Fields]
+      summary: List user's fields (with spatial filters)
+      description: Returns active fields owned by the authenticated user with optional spatial filters and pagination.
+      security:
+        - bearerAuth: []
+      parameters:
+        - in: query
+          name: bbox
+          schema:
+            type: string
+            pattern: '^-?\\d{1,3}\\.\\d+,-?\\d{1,2}\\.\\d+,-?\\d{1,3}\\.\\d+,-?\\d{1,2}\\.\\d+$'
+          description: 'minLon,minLat,maxLon,maxLat (SRID 4326)'
+        - in: query
+          name: near
+          schema:
+            type: string
+            pattern: '^-?\\d{1,2}\\.\\d+,-?\\d{1,3}\\.\\d+,\\d{1,6}$'
+          description: 'lat,lon,radius_m (uses ST_DWithin on center)'
+        - in: query
+          name: intersects
+          schema:
+            type: string
+          description: 'GeoJSON Polygon/MultiPolygon as string or "field:{uuid}"'
+        - in: query
+          name: page
+          schema: { type: integer, minimum: 1, default: 1 }
+        - in: query
+          name: page_size
+          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
+        - in: query
+          name: sort
+          schema: { type: string, enum: [name, created_at, area_sqm], default: created_at }
+        - in: query
+          name: order
+          schema: { type: string, enum: [asc, desc], default: desc }
+      responses:
+        '200':
+          description: List of fields
+          content:
+            application/json:
+              schema:
+                type: object
+                properties:
+                  success: { type: boolean, example: true }
+                  data:
+                    type: array
+                    items:
+                      $ref: '#/components/schemas/Field'
+                  pagination:
+                    type: object
+                    properties:
+                      page: { type: integer, example: 1 }
+                      page_size: { type: integer, example: 20 }
+                      total: { type: integer, example: 2 }
+                required: [success, data]
+        '400':
+          description: Invalid query parameters
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '401':
+          description: Unauthorized
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
@@ -258,23 +319,17 @@
     post:
       tags: [Fields]
       summary: Create a new field (manual boundary)
-      description: Creates a field using a provided boundary polygon and name
+      description: Creates a field using a provided boundary polygon and name. Validates ST_IsValid and non-self-intersection. Computes area_sqm from geography and center via ST_Centroid.
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
-              type: object
-              required: [name, boundary]
-              properties:
-                name:
-                  type: string
-                  minLength: 1
-                  maxLength: 50
-                boundary:
-                  type: object
-                  description: GeoJSON Polygon (WGS84, within Sri Lanka)
+              $ref: '#/components/schemas/FieldCreateRequest'
       responses:
         '201':
           description: Field created
           content:
             application/json:
               schema:
-                type: object
-                properties:
-                  success:
-                    type: boolean
-                    example: true
-                  data:
-                    type: object
-                    properties:
-                      field_id:
-                        type: string
-                        format: uuid
-                      user_id:
-                        type: string
-                        format: uuid
-                      name:
-                        type: string
-                      boundary:
-                        type: object
-                      area:
-                        type: number
-                        format: float
-                      center:
-                        type: object
-                      status:
-                        type: string
-                        enum: [active, archived, deleted]
-                      created_at:
-                        type: string
-                        format: date-time
-                      updated_at:
-                        type: string
-                        format: date-time
+                type: object
+                properties:
+                  success: { type: boolean, example: true }
+                  data:
+                    $ref: '#/components/schemas/Field'
+                  warnings:
+                    type: array
+                    items:
+                      type: object
+                      properties:
+                        code: { type: string, example: GEOMETRY_SNAPPED }
+                        message: { type: string }
         '400':
           description: Validation error
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/Error'
@@ -369,7 +424,7 @@
-    put:
+    patch:
       tags: [Fields]
-      summary: Update field metadata
+      summary: Update field metadata (name/status)
       description: Update field name
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
-              required: [name]
               properties:
                 name:
                   type: string
                   minLength: 1
                   maxLength: 50
+                status:
+                  type: string
+                  enum: [active, archived, deleted]
       responses:
         '200':
           description: Field updated
@@ -442,6 +497,142 @@
         '404':
           description: Not found
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/Error'
+
+  /api/v1/satellite/tiles/{z}/{x}/{y}:
+    get:
+      tags: [Satellite]
+      summary: Get Sentinel-2 tile via proxy
+      description: Returns a tile image. Supports ETag and Cache-Control headers; Redis-backed caching.
+      security:
+        - bearerAuth: []
+      parameters:
+        - in: path
+          name: z
+          required: true
+          schema: { type: integer, minimum: 0 }
+        - in: path
+          name: x
+          required: true
+          schema: { type: integer, minimum: 0 }
+        - in: path
+          name: y
+          required: true
+          schema: { type: integer, minimum: 0 }
+        - in: query
+          name: bands
+          schema:
+            type: string
+            description: CSV list of bands
+            example: RGB,NIR
+        - in: query
+          name: date
+          schema: { type: string, format: date }
+        - in: query
+          name: cloud_lt
+          schema: { type: integer, minimum: 0, maximum: 100, default: 20 }
+      responses:
+        '200':
+          description: Tile image
+          headers:
+            ETag: { schema: { type: string } }
+            Cache-Control: { schema: { type: string }, example: public, max-age=21600 }
+          content:
+            image/png:
+              schema: { type: string, format: binary }
+            image/jpeg:
+              schema: { type: string, format: binary }
+        '304':
+          description: Not Modified
+        '400':
+          description: Validation error
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '401':
+          description: Unauthorized
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '503':
+          description: Upstream unavailable
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+
+  /api/v1/satellite/preprocess:
+    post:
+      tags: [Satellite]
+      summary: Submit preprocessing job (idempotent)
+      description: Submits a preprocess job for bbox/date/bands/cloud-mask. Uses Idempotency-Key header.
+      security:
+        - bearerAuth: []
+      parameters:
+        - in: header
+          name: Idempotency-Key
+          required: true
+          schema: { type: string, minLength: 1, maxLength: 128 }
+      requestBody:
+        required: true
+        content:
+          application/json:
+            schema:
+              type: object
+              required: [bbox, date, bands]
+              properties:
+                bbox:
+                  type: array
+                  items: { type: number }
+                  minItems: 4
+                  maxItems: 4
+                date:
+                  type: string
+                  format: date
+                bands:
+                  type: array
+                  items: { type: string, enum: [RGB, NIR, SWIR] }
+                  minItems: 1
+                cloud_mask:
+                  type: boolean
+                  default: true
+      responses:
+        '202':
+          description: Accepted
+          content:
+            application/json:
+              schema:
+                type: object
+                properties:
+                  success: { type: boolean, example: true }
+                  data:
+                    type: object
+                    properties:
+                      request_id: { type: string }
+                      status: { type: string, example: accepted }
+                      received_at: { type: string, format: date-time }
+        '400':
+          description: Validation error or missing Idempotency-Key
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '401':
+          description: Unauthorized
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+
+  /api/v1/ml/segmentation/predict:
+    post:
+      tags: [ML]
+      summary: Segmentation mask prediction
+      description: Produces segmentation mask for bbox or field_id. Proxies to internal ML service.
+      security:
+        - bearerAuth: []
+      requestBody:
+        required: true
+        content:
+          application/json:
+            schema:
+              $ref: '#/components/schemas/MLPredictRequest'
+      responses:
+        '200':
+          description: Prediction result
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/MLMaskResponse'
+        '400':
+          description: Invalid input
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '401':
+          description: Unauthorized
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '404':
+          description: Model not found
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
+        '504':
+          description: Timeout
+          content:
+            application/json:
+              schema:
+                $ref: '#/components/schemas/Error'
@@ -498,6 +689,155 @@
 components:
   securitySchemes:
     bearerAuth:
       type: http
       scheme: bearer
       bearerFormat: JWT
@@ -505,6 +745,216 @@
   schemas:
+    GeoJSONPolygon:
+      type: object
+      description: GeoJSON Polygon or MultiPolygon in SRID 4326
+      oneOf:
+        - type: object
+          properties:
+            type: { type: string, enum: [Polygon] }
+            coordinates:
+              type: array
+              description: Array of linear rings (first is outer ring, subsequent are holes)
+              items:
+                type: array
+                items:
+                  type: array
+                  minItems: 2
+                  items:
+                    type: number
+          required: [type, coordinates]
+        - type: object
+          properties:
+            type: { type: string, enum: [MultiPolygon] }
+            coordinates:
+              type: array
+              items:
+                type: array
+      examples:
+        - { "type":"Polygon","coordinates":[[[80.1,7.2],[80.11,7.2],[80.11,7.21],[80.1,7.21],[80.1,7.2]]]}
+
+    Field:
+      type: object
+      properties:
+        field_id: { type: string, format: uuid }
+        user_id: { type: string, format: uuid }
+        name: { type: string }
+        boundary:
+          $ref: '#/components/schemas/GeoJSONPolygon'
+        area_sqm:
+          type: number
+          format: float
+          description: Area in square meters computed via ST_Area(geography)
+        center:
+          type: object
+          description: GeoJSON Point
+          properties:
+            type: { type: string, enum: [Point] }
+            coordinates:
+              type: array
+              minItems: 2
+              maxItems: 3
+              items: { type: number }
+        status: { type: string, enum: [active, archived, deleted] }
+        created_at: { type: string, format: date-time }
+        updated_at: { type: string, format: date-time }
+      required: [field_id, user_id, name, boundary, area_sqm, center, status, created_at, updated_at]
+
+    FieldCreateRequest:
+      type: object
+      required: [name, boundary]
+      properties:
+        name:
+          type: string
+          minLength: 1
+          maxLength: 50
+        boundary:
+          $ref: '#/components/schemas/GeoJSONPolygon'
+
+    ErrorResponse:
+      allOf:
+        - $ref: '#/components/schemas/Error'
+
+    TileResponse:
+      type: object
+      description: Placeholder schema for documentation; actual body is binary image. Headers include ETag and Cache-Control.
+      properties:
+        etag: { type: string }
+        cache_control: { type: string }
+
+    MLPredictRequest:
+      type: object
+      properties:
+        bbox:
+          type: array
+          items: { type: number }
+          minItems: 4
+          maxItems: 4
+          description: [minLon,minLat,maxLon,maxLat]
+        field_id:
+          type: string
+          format: uuid
+        date:
+          type: string
+          format: date
+        model_version:
+          type: string
+          example: unet-1.0.0
+        tiling:
+          type: object
+          properties:
+            size: { type: integer, default: 512 }
+            overlap: { type: integer, default: 64 }
+        return:
+          type: string
+          enum: [mask_url, inline]
+          default: mask_url
+      oneOf:
+        - required: [bbox, date]
+        - required: [field_id, date]
+
+    MLMaskResponse:
+      type: object
+      properties:
+        success: { type: boolean, example: true }
+        data:
+          type: object
+          properties:
+            request_id: { type: string }
+            model:
+              type: object
+              properties:
+                name: { type: string, example: unet }
+                version: { type: string, example: 1.0.0 }
+            mask_url: { type: string, format: uri }
+            mask_base64: { type: string, description: inline encoded mask when requested }
+            mask_format: { type: string, enum: [geojson, png] }
+            metrics:
+              type: object
+              properties:
+                latency_ms: { type: integer }
+                tile_count: { type: integer }
+                cloud_coverage: { type: number, format: float }
+            warnings:
+              type: array
+              items: { type: string }