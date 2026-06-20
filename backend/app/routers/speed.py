"""Speed Analytics router — simulated speed zone data from violations dataset."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/api/speed", tags=["speed"])

# Speed categories and zone limits for Bengaluru junctions
SPEED_ZONES = [
    {"zone_name": "MG Road Junction", "speed_limit_kmh": 40, "lat": 12.9757, "lon": 77.6033},
    {"zone_name": "Silk Board Junction", "speed_limit_kmh": 30, "lat": 12.9175, "lon": 77.6237},
    {"zone_name": "Hebbal Flyover", "speed_limit_kmh": 60, "lat": 13.0358, "lon": 77.5970},
    {"zone_name": "Electronic City Toll", "speed_limit_kmh": 80, "lat": 12.8458, "lon": 77.6641},
    {"zone_name": "Marathahalli Bridge", "speed_limit_kmh": 40, "lat": 12.9558, "lon": 77.7010},
    {"zone_name": "KR Puram", "speed_limit_kmh": 40, "lat": 13.0002, "lon": 77.6925},
    {"zone_name": "Whitefield Main Road", "speed_limit_kmh": 50, "lat": 12.9698, "lon": 77.7500},
    {"zone_name": "Yeshwantpur Signal", "speed_limit_kmh": 30, "lat": 13.0215, "lon": 77.5511},
    {"zone_name": "Koramangala 5th Block", "speed_limit_kmh": 30, "lat": 12.9341, "lon": 77.6268},
    {"zone_name": "Indiranagar 100ft Road", "speed_limit_kmh": 40, "lat": 12.9784, "lon": 77.6408},
]

@router.get("/zones")
async def get_speed_zones():
    """Returns all configured speed limit zones."""
    return SPEED_ZONES

@router.get("/stats")
async def get_speed_stats(db: AsyncSession = Depends(get_db)):
    """Returns distribution of simulated speed categories derived from violation severity."""
    result = await db.execute(text("""
        SELECT
            CASE
                WHEN severity_weight < 1.0 THEN 'slow_0_30'
                WHEN severity_weight < 1.5 THEN 'normal_30_60'
                WHEN severity_weight < 2.5 THEN 'caution_60_80'
                WHEN severity_weight < 4.0 THEN 'violation_80_120'
                ELSE 'dangerous_120_plus'
            END as speed_category,
            COUNT(*) as count,
            ROUND(AVG(severity_weight * 30)::numeric, 1) as avg_simulated_speed_kmh
        FROM violations
        WHERE severity_weight IS NOT NULL
        GROUP BY speed_category
        ORDER BY avg_simulated_speed_kmh ASC
    """))
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/violations")
async def get_speed_violations(db: AsyncSession = Depends(get_db)):
    """Returns top 50 speed-related violation events (simulated from severity > 2.5)."""
    result = await db.execute(text("""
        SELECT id, vehicle_number, vehicle_type, latitude, longitude, junction_name,
               police_station, severity_weight,
               ROUND((severity_weight * 30)::numeric, 1) as simulated_speed_kmh,
               created_datetime
        FROM violations
        WHERE severity_weight > 2.5 AND latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY severity_weight DESC
        LIMIT 50
    """))
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/by-zone")
async def get_speed_by_zone(db: AsyncSession = Depends(get_db)):
    """Returns speed statistics grouped by junction/zone."""
    result = await db.execute(text("""
        SELECT
            COALESCE(junction_name, police_station, 'Unknown') as zone,
            COUNT(*) as total_incidents,
            ROUND(AVG(severity_weight * 30)::numeric, 1) as avg_speed_kmh,
            ROUND(MAX(severity_weight * 30)::numeric, 1) as max_speed_kmh,
            SUM(CASE WHEN severity_weight > 2.5 THEN 1 ELSE 0 END) as overspeed_count
        FROM violations
        WHERE severity_weight IS NOT NULL
        GROUP BY COALESCE(junction_name, police_station, 'Unknown')
        ORDER BY overspeed_count DESC
        LIMIT 20
    """))
    return [dict(r._mapping) for r in result.fetchall()]
