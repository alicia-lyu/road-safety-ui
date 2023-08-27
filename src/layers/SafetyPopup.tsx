import styles from '@/layers/MapFeaturePopup.module.css'
import MapPopup from '@/layers/MapPopup'
import { Map } from 'ol'
import { Coordinate } from '@/stores/QueryStore'

interface SafetyPopupProps {
    map: Map,
    safetyScore: number,
    explanationProperties: object,
    coordinate: Coordinate | null
}

/**
 * The popup shown when certain map features are hovered. For example a road of the routing graph layer.
 */
export default function SafetyPopup({ map, safetyScore, explanationProperties, coordinate }: SafetyPopupProps) {
    return (
        <MapPopup map={map} coordinate={coordinate}>
            <div className={styles.popup}>
                <p>{`Safety Score: ${safetyScore}`}</p>
                <ul className={styles.explanation}>
                    {Object.entries(explanationProperties).map(([k, v], index) => {
                        if (v instanceof Array) {
                            return <li key={index}>
                                <ul>{`${k}:`}
                                    {v.map((v, index) => <li key={index}>{v}</li>)}
                                </ul>
                            </li>
                        }
                        return <li key={index}>{`${k}: ${v}`}</li>
                    })}
                </ul>
            </div>
        </MapPopup>
    )
}
