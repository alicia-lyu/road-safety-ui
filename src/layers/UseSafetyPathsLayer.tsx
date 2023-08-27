import { Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Stroke, Style } from 'ol/style'
import Feature, { FeatureLike } from 'ol/Feature'
import { Geometry, LineString } from 'ol/geom'
import { PathWithSafety } from '@/stores/SafetyStore'
import { fromLonLat } from 'ol/proj'

const safetyPathsLayerKey = 'safetyPathsLayer'

// Copied from UsePathsLayer.tsx
// Code related to accessNetworkLayer deleted, might have backlash
export default function useSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    useEffect(() => {
        removeCurrentSafetyPathsLayers(map)
        addSafetyPathsLayer(
            map,
            paths,
            selectedPath
        )
        return () => {
            removeCurrentSafetyPathsLayers(map)
        }
    }, [map, paths, selectedPath])
}

function removeCurrentSafetyPathsLayers(map: Map) {
    map.getLayers()
        .getArray()
        .filter(l => l.get(safetyPathsLayerKey))
        .forEach(l => map.removeLayer(l))
}

function addSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    const features = createSegments(pickSelectedPath(paths, selectedPath))
    const layer = new VectorLayer({
        source: new VectorSource({
            features: features
        }),
        style: createStyleFunction,
        opacity: 1,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(3)
    map.addLayer(layer)
    hoverOnFeature(map);
}

function hoverOnFeature(map: Map) {
    let selected: Feature | null = null;
    const selectStyle = new Style({
        stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.9)',
            width: 10,
        }),
    });
    map.on('pointermove', function (e) {
        if (selected !== null) {
            selected.setStyle(undefined);
            selected = null;
        }

        map.forEachFeatureAtPixel(e.pixel, function (f) {
            const feature = f as Feature;
            selected = feature
            feature.setStyle(selectStyle)
            return true;
        });
    });
}

function pickSelectedPath(paths: PathWithSafety[], selectedPath: Path): PathWithSafety[] {
    return paths.filter(path => path.points == selectedPath.points)
}

function createSegments(paths: PathWithSafety[]) {
    const segmentFeatures: Feature<Geometry>[] = [];
    paths.forEach(path => {
        path.segments.forEach(segment => {
            const geometry = new LineString(segment.coordinates.map(
                coordinate => fromLonLat(coordinate)
            ))
            const feature = new Feature({
                geometry: geometry,
                safety: segment.index
            })
            //feature.setStyle(createStyleFunction(feature, 100))
            segmentFeatures.push(feature)
        })
    })
    return segmentFeatures
}
function createStyleFunction(feature: FeatureLike, resolution: number) {
    const safetyScore = feature.getProperties().safety
    const color = `rgba(255, 69, 58, ${(5 - safetyScore) / 5})`
    const style = new Style({
        stroke: new Stroke({
            color: color,
            width: 6,
            lineCap: 'square',
            lineJoin: 'round',
        }),
    })
    return style
}
