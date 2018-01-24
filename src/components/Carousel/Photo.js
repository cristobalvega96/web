import React from 'react'
import PropTypes from 'prop-types'

import moment from 'moment'

import { toDegrees, googleMapsUrl } from 'tools/other'
import Styles from './Carousel.css'


moment.locale('es')

const Photo = (props) => {
  const {
    lazyLoad,
    description,
    address,
    location,
    organizationId,
    submitted,
    url,
    urlMedium,
    urlSmall,
  } = props

  const { lat, lng } = location || {}
  let latLng = null
  if (lat) {
    const [latsign, latd, latm, lats] = toDegrees(lat)
    const [lngsign, lngd, lngm, lngs] = toDegrees(lng)
    const latStr = `${latd}°${latm}'${lats}"${latsign >= 0 ? 'N' : 'S'}`
    const lngStr = `${lngd}°${lngm}'${lngs}"${lngsign >= 0 ? 'E' : 'W'}`
    latLng = <a className={Styles.mapLink} target="_blank" href={googleMapsUrl(lat, lng)}>{`${latStr} ${lngStr}`}</a>
  }

  return (
    <div className={Styles.outerBox}>
      <div className={Styles.innerBox}>
        {lazyLoad ? <div /> : <img src={urlMedium} alt={description} />}
        <div className={Styles.labelContainer}>
          <span className={Styles.label}>{moment(submitted).format('h:mma, DD MMMM YYYY')}</span>
          <span className={Styles.label}>{latLng}</span>
        </div>
        <span className={Styles.description}>{description}</span>
      </div>
    </div>
  )
}

Photo.propTypes = {
  lazyLoad: PropTypes.bool,
  description: PropTypes.string,
  address: PropTypes.string,
  location: PropTypes.object,
  organizationId: PropTypes.number.isRequired,
  submitted: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  urlMedium: PropTypes.string.isRequired,
  urlSmall: PropTypes.string.isRequired,
}

export default Photo