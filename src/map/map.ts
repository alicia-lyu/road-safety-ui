import Dispatcher from '@/stores/Dispatcher'
import { Map, View } from 'ol'
import { fromLonLat } from 'ol/proj'
import { MapIsLoaded } from '@/actions/Actions'
import { defaults as defaultControls } from 'ol/control'
import styles from '@/map/Map.module.css'
import { getApi } from '@/api/Api'
import { Polygon } from 'ol/geom'

let map: Map | undefined

export function createMap(): Map {
    map = new Map({
        view: new View({
            enableRotation: false,
            multiWorld: false,
            constrainResolution: true,
            center: fromLonLat([10, 10]),
            zoom: 1,
        }),
        controls: defaultControls({
            zoom: true,
            zoomOptions: {
                className: styles.customZoom,
            },
            attribution: true,
            attributionOptions: {
                className: styles.customAttribution,
                collapsible: false,
            },
        }),
    })
    map.once('postrender', () => {
        Dispatcher.dispatch(new MapIsLoaded())
    })
    centerMap(map)
    return map
}

async function centerMap(map: Map) {
    const apiInfo = await getApi().info()
    const bbox = apiInfo.bbox
    console.log(bbox)
    const coordinates = [
        fromLonLat([bbox[0], bbox[1]]),  
        fromLonLat([bbox[2], bbox[1]]),  
        fromLonLat([bbox[0], bbox[3]]),  
        fromLonLat([bbox[2], bbox[3]]), 
        fromLonLat([bbox[0], bbox[1]])   // close the ring by repeating the first point
    ];
    console.log(coordinates);
    const bboxPolygon: Polygon = new Polygon([coordinates])
    map.getView().fit(bboxPolygon, {
        padding: [170, 50, 30, 150],
        maxZoom: 6
    })
    console.log("recentering map")
}

export function setMap(m: Map) {
    map = m
}
export function getMap(): Map {
    if (!map) throw Error('Map must be initialized before it can be used. Use "createMap" when starting the app')
    return map
}
