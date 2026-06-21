import os

def remove_geom(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove from models
    content = content.replace("from geoalchemy2 import Geography", "")
    content = content.replace("geom = Column(Geography(geometry_type=\"POINT\", srid=4326), nullable=True)", "")
    content = content.replace("geom = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)", "")
    
    # Remove from reports
    content = content.replace("latitude, longitude, geom, status", "latitude, longitude, status")
    content = content.replace(":lat, :lon, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 'pending'", ":lat, :lon, 'pending'")
    
    # Rewrite officers.py get_nearby_hotspots query
    if "ST_DWithin" in content:
        old_query = '''        SELECT junction_name, geom, severity_weight
        FROM (
            SELECT junction_name, 
                   ST_Centroid(ST_Collect(geom::geometry))::geography as center_geom,
                   AVG(severity_weight) as severity_weight
            FROM violations 
            WHERE created_datetime >= NOW() - INTERVAL '24 hours'
              AND is_junction = TRUE
              AND severity_weight >= 2.0
            GROUP BY junction_name
        ) AS hotspots
        WHERE ST_DWithin(center_geom, :officer_geom, 1000) -- within 1km
        ORDER BY ST_Distance(center_geom, :officer_geom) ASC'''
        
        new_query = '''        SELECT junction_name,
               AVG(latitude) as center_lat,
               AVG(longitude) as center_lon,
               AVG(severity_weight) as severity_weight
        FROM violations 
        WHERE created_datetime >= NOW() - INTERVAL '24 hours'
          AND is_junction = TRUE
          AND severity_weight >= 2.0
        GROUP BY junction_name
        HAVING (
          6371 * acos(cos(radians(:officer_lat)) * cos(radians(AVG(latitude))) * cos(radians(AVG(longitude)) - radians(:officer_lon)) + sin(radians(:officer_lat)) * sin(radians(AVG(latitude))))
        ) < 1.0
        ORDER BY (
          6371 * acos(cos(radians(:officer_lat)) * cos(radians(AVG(latitude))) * cos(radians(AVG(longitude)) - radians(:officer_lon)) + sin(radians(:officer_lat)) * sin(radians(AVG(latitude))))
        ) ASC'''
        
        content = content.replace(old_query, new_query)
        content = content.replace("{\"officer_geom\": loc.geom}", "{\"officer_lat\": loc.latitude, \"officer_lon\": loc.longitude}")
        
    # Remove geom from officers.py clock in
    content = content.replace("latitude, longitude, geom, timestamp", "latitude, longitude, timestamp")
    content = content.replace(":lat, :lon, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW()", ":lat, :lon, NOW()")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

remove_geom('backend/app/models.py')
remove_geom('backend/app/routers/officers.py')
remove_geom('backend/app/routers/reports.py')
print("Done removing geom")
