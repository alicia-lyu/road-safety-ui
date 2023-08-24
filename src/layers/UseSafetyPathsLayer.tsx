import { Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Stroke, Style } from 'ol/style'
import Feature, { FeatureLike } from 'ol/Feature'
import { LineString } from 'ol/geom'
import { PathWithSafety } from '@/stores/SafetyStore'
import { Coordinate } from 'ol/coordinate'

const safetyPathsLayerKey = 'safetyPathsLayer'
const selectedSafetyPathLayerKey = 'selectedSafetyPathLayer'

// Copied from UsePathsLayer.tsx
// Code related to accessNetworkLayer deleted, might have backlash
export default function useSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    useEffect(() => {
        console.log("Safety Paths", paths)
        removeCurrentSafetyPathsLayers(map)
        addSafetyPathsLayer(
            map,
            paths
        )
        return () => {
            removeCurrentSafetyPathsLayers(map)
        }
    }, [map, paths, selectedPath])
}

function removeCurrentSafetyPathsLayers(map: Map) {
    map.getLayers()
        .getArray()
        .filter(l => l.get(safetyPathsLayerKey) || l.get(selectedSafetyPathLayerKey))
        .forEach(l => map.removeLayer(l))
}

function addSafetyPathsLayer(map: Map, paths: PathWithSafety[]) {
    const features = createSegments(paths)
    const layer = new VectorLayer({
        source: new VectorSource({
            features: features
        }),
        style: createStyleFunction,
        opacity: 0.5,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(3)
    console.log("Safety Paths Layer: ", layer)
    map.addLayer(layer)
}

function createSegments(paths: PathWithSafety[]) {
    const segmentFeatures: Feature[] = [];
    paths.forEach(path => {
        path.segments.forEach((start, index) => {
            if (index == path.segments.length - 1) return
            const end = path.segments[index + 1]
            const geometry = new LineString([start.coordinates[0] as Coordinate, end.coordinates[0] as Coordinate])
            const feature = new Feature({
                geometry: geometry,
                safety: start.index
            })
            segmentFeatures.push(feature)
        })
    })
    console.log("Segments: ", segmentFeatures)
    return segmentFeatures
}

function createStyleFunction(feature: FeatureLike, resolution: number) {
    const safetyScore = feature.getProperties().safety
    const color = `[255, 69, 58, ${(5 - safetyScore) / 5}]`
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