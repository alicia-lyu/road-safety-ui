import styles from './RoutingProfiles.module.css'
import Dispatcher from '@/stores/Dispatcher'
import { SetVehicleProfile } from '@/actions/Actions'
import { RoutingProfile } from '@/api/graphhopper'
import PlainButton from '@/PlainButton'
import BicycleIcon from './bike.svg'
import CarIcon from './car.svg'
import FootIcon from './foot.svg'
import HikeIcon from './hike.svg'
import MotorcycleIcon from './motorcycle.svg'
import MtbBicycleIcon from './mtb-bicycle.svg'
import RacingbikeIcon from './racingbike.svg'
import ScooterIcon from './scooter.svg'
import SmallTruckIcon from './small_truck.svg'
import TruckIcon from './truck.svg'
import WheelchairIcon from './wheelchair.svg'
import GearIcon from './gear.svg'
import { tr } from '@/translation/Translation'
import CustomModelBoxSVG from '@/sidebar/open_custom_model.svg'
import { useMemo } from 'react'

export default function ({
    routingProfiles,
    selectedProfile,
    showCustomModelBox,
    toggleCustomModelBox,
    customModelBoxEnabled,
}: {
    routingProfiles: RoutingProfile[]
    selectedProfile: RoutingProfile
    showCustomModelBox: boolean
    toggleCustomModelBox: () => void
    customModelBoxEnabled: boolean
}) {
    routingProfiles = useMemo(() => moveCustomProfilesToRear(routingProfiles), [routingProfiles]);
    return (
        <div className={styles.profilesParent}>
            <PlainButton
                title={tr('open_custom_model_box')}
                className={showCustomModelBox ? styles.enabledCMBox : styles.cmBox}
                onClick={toggleCustomModelBox}
            >
                <CustomModelBoxSVG />
            </PlainButton>
            <ul className={styles.profiles}>
                {routingProfiles.map(profile => {
                    const className =
                        profile.name === selectedProfile.name
                            ? styles.selectedProfile + ' ' + styles.profileBtn
                            : styles.profileBtn
                    return (
                        <li key={profile.name} className={styles.profileLi}>
                            <PlainButton
                                title={tr(profile.name)}
                                onClick={() => Dispatcher.dispatch(new SetVehicleProfile(profile))}
                                className={className}
                            >
                                {customModelBoxEnabled && profile.name === selectedProfile.name && (
                                    <CustomModelBoxSVG className={styles.asIndicator} />
                                )}
                                {getIcon(profile)}
                            </PlainButton>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function getIcon(profile: RoutingProfile) {
    switch (profile.name) {
        case 'car':
            return <CarIcon />
        case 'small_truck':
            return <SmallTruckIcon />
        case 'truck':
            return <TruckIcon />
        case 'scooter':
            return <ScooterIcon />
        case 'foot':
            return <FootIcon />
        case 'hike':
            return <HikeIcon />
        case 'bike':
            return <BicycleIcon />
        case 'mtb':
            return <MtbBicycleIcon />
        case 'racingbike':
            return <RacingbikeIcon />
        case 'motorcycle':
            return <MotorcycleIcon />
        case 'wheelchair':
            return <WheelchairIcon />
        default:
            return <GearIcon alt={profile.name}/>
    }
}

function moveCustomProfilesToRear(profiles: RoutingProfile[]) {
    const customProfiles = profiles.filter(profile => !isRegular(profile))
    const regularProfiles = profiles.filter(profile => isRegular(profile))
    return regularProfiles.concat(customProfiles)
}

function isRegular(profile: RoutingProfile): boolean {
    const regularProfileNames = [
        'car',
        'small_truck',
        'truck',
        'scooter',
        'foot',
        'hike',
        'bike',
        'mtb',
        'racingbike',
        'motorcycle',
        'wheelchair',
    ]
    return regularProfileNames.includes(profile.name)
}