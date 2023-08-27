import styles from '@/layers/MapFeaturePopup.module.css'
import MapPopup from '@/layers/MapPopup'
import { Map } from 'ol'
import { Coordinate } from '@/stores/QueryStore'

interface SafetyPopupProps {
    map: Map,
    safetyScore: number,
    explanationProperties: object,
    coordinate: Coordinate
}

/**
 * The popup shown when certain map features are hovered. For example a road of the routing graph layer.
 */
export default function SafetyPopup({ map, safetyScore, explanationProperties, coordinate }: SafetyPopupProps) {
    return (
        <MapPopup map={map} coordinate={coordinate}>
            <div className={styles.popup}>
                <p>{`Safety Score: ${safetyScore}`}</p>
                <ul>
                    {Object.entries(explanationProperties).map(([k, v], index) => {
                        return <li key={index}>{`${k}=${v}`}</li>
                    })}
                </ul>
            </div>
        </MapPopup>
    )
}
