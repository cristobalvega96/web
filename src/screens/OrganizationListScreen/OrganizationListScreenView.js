import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import debounce from 'lodash/debounce'

import FilterHeader, { parseFilterQueryParams } from 'components/FilterHeader'
import SearchInput from 'components/SearchInput'
import OrganizationListItem from 'components/OrganizationListItem'
import LocalityDamageMap from 'components/LocalityDamageMap'
import LocalityPopup from 'components/LocalityDamageMap/LocalityPopup'
import LocalityLegend from 'components/LocalityDamageMap/LocalityLegend'
import LoadingIndicatorCircle from 'components/LoadingIndicator/LoadingIndicatorCircle'
import { tokenMatch } from 'tools/string'
import { itemFromScrollEvent, dmgGrade } from 'tools/other'
import Styles from './OrganizationListScreenView.css'


class OrganizationList extends React.PureComponent {
  handleScroll = (e) => {
    this.props.onScroll(e, this.props.organizations)
  }

  render() {
    const { organizations, onScroll, focusedId, ...rest } = this.props
    const items = organizations.map((o) => {
      const { id } = o

      return (
        <OrganizationListItem
          key={id}
          to={`/reconstructores/${id}`}
          organization={o}
          focused={id === focusedId}
          {...rest}
        />
      )
    })
    return <div onScroll={this.handleScroll} className={Styles.orgsContainer}>{items}</div>
  }
}

OrganizationList.propTypes = {
  organizations: PropTypes.arrayOf(PropTypes.object).isRequired,
  onScroll: PropTypes.func.isRequired,
  focusedId: PropTypes.number,
}

class OrganizationListScreenView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      popup: null,
      focused: null,
      organizationSearch: '',
      filtersVisible: false,
    }
    this.handleOrganizationSearchKeyUp = debounce(this.handleOrganizationSearchKeyUp, 150)
  }

  componentDidMount() {
    document.title = 'Reconstructores - Brigada'
  }

  handleOrganizationSearchKeyUp = (organizationSearch) => {
    this.setState({ organizationSearch })
  }

  handleClickFeature = (feature) => {
    this.props.history.push(`/comunidades/${feature.properties.id}`)
  }

  handleEnterFeature = (feature) => {
    const locality = JSON.parse(feature.properties.locality) || {}
    this.setState({ popup: { locality, organization: this.state.focused } })
  }

  handleLeaveFeature = () => {
    this.setState({ popup: null })
  }

  handleEnterListItem = (item) => {
    this.setState({ focused: item })
  }

  handleScroll = (e, organizations) => {
    if (window.innerWidth >= 980) return
    this.setState({ focused: itemFromScrollEvent(e, organizations) })
  }

  handleToggleFilters = () => {
    this.setState({ filtersVisible: !this.state.filtersVisible })
  }

  filterOrganizations = (results) => {
    const { organizationSearch } = this.state
    const { valState, valMuni, valSector, valActionType } = this.props


    return results.filter((o) => {
      const { name, desc, actionCvegeos } = o

      const matchesSearch = tokenMatch(`${name} ${desc}`, organizationSearch)

      const cvegeos = valState.map(v => v.value).concat(valMuni.map(v => v.value))
      const matchesCvegeo = cvegeos.length === 0 || cvegeos.some(v => actionCvegeos.has(v))

      const sectors = valSector.map(v => v.value)
      const matchesSector = sectors.length === 0 || sectors.some(v => o.sector === v)

      const actionTypes = valActionType.map(v => v.value)
      let matchesActionType = actionTypes.length === 0
      for (const action of o.actions) {
        if (actionTypes.some(v => action.action_type === v)) {
          matchesActionType = true
          break
        }
      }

      return matchesSearch && matchesCvegeo && matchesSector && matchesActionType
    })
  }

  getLocalityFeatures = (organization) => {
    const localities = []
    const features = organization.actions.map((action) => {
      const { locality } = action
      const { location: { lat, lng }, cvegeo, id, meta: { total = -1 } } = locality
      localities.push(locality)

      return {
        type: 'Feature',
        properties: {
          cvegeo,
          id,
          total,
          locality,
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }
    })
    return { localities, features }
  }

  getLocalitiesFromOrgs = (organizations) => {
    try {
      const localitiesPerOrg = organizations.data.results.map((o) => {
        return o.actions.map((a) => {
          const { locality } = a
          locality.dmgGrade = dmgGrade(locality)
          return locality
        })
      })
      return [].concat(...localitiesPerOrg)
    } catch (e) {
      return []
    }
  }

  render() {
    const { organizations: { data: orgData, loading: orgLoading } } = this.props
    const { valState, valMuni, valSector, valActionType, fitBounds } = this.props
    const { popup, focused, filtersVisible } = this.state

    const organizations = this.filterOrganizations(orgData ? orgData.results : [])
    let [_focused] = organizations
    if (focused && organizations.some(o => focused.id === o.id)) _focused = focused

    let localities = []
    let features = []
    if (_focused) ({ localities, features } = this.getLocalityFeatures(_focused))

    const filter = (style = {}) => {
      return (
        <FilterHeader
          style={style}
          localities={this.getLocalitiesFromOrgs(this.props.organizations)}
          actions={orgData ? [].concat(...orgData.results.map(o => o.actions)) : []}
          valState={valState}
          valMuni={valMuni}
          valSector={valSector}
          valActionType={valActionType}
        />
      )
    }

    return (
      <React.Fragment>
        <div className={Styles.shadow}>
          <div className="row middle between wrapper sm-hidden xs-hidden">
            {filter()}
            <SearchInput
              numResults={organizations.length}
              onKeyUp={this.handleOrganizationSearchKeyUp}
            />
          </div>
        </div>

        <div className={`${Styles.search} md-hidden lg-hidden`}>
          <SearchInput
            numResults={organizations.length}
            onKeyUp={this.handleOrganizationSearchKeyUp}
          />
        </div>

        <div className="row baseline between wrapper lg-hidden md-hidden">
          <span className={Styles.filterButton} onClick={this.handleToggleFilters}>FILTROS</span>
          <LocalityLegend localities={localities} legendTitle="¿Dónde opera?" />
        </div>

        {filtersVisible &&
          <React.Fragment>
            <div className={`${Styles.filtersSmallScreen} lg-hidden md-hidden`}>{filter({ maxWidth: '100vw' })}</div>
            <span className={`${Styles.updateButton} lg-hidden md-hidden`} onClick={this.handleToggleFilters}>
              Actualizar resultados
            </span>
          </React.Fragment>
        }

        <div className={`${Styles.container} row`}>
          <div className={`${Styles.flexOverflow} col-lg-6 col-md-6 col-sm-8 col-xs-4 gutter last-sm last-xs`}>
            {orgLoading && <LoadingIndicatorCircle className={Styles.loader} />}
            {!orgLoading &&
              <OrganizationList
                organizations={organizations}
                onScroll={this.handleScroll}
                focusedId={_focused && _focused.id}
                onMouseEnter={this.handleEnterListItem}
                onMouseLeave={this.handleLeaveListItem}
              />
            }
          </div>
          <div className={`${Styles.flexOverflowTwo} col-lg-6 col-md-6 col-sm-8 col-xs-4`}>
            <div className={Styles.mapContainer}>
              <LocalityDamageMap
                features={features}
                popup={popup && <LocalityPopup
                  locality={popup.locality}
                  organization={popup.organization}
                  screen="org"
                />}
                onClickFeature={this.handleClickFeature}
                onEnterFeature={this.handleEnterFeature}
                onLeaveFeature={this.handleLeaveFeature}
                fitBounds={fitBounds.length > 0 ? fitBounds : undefined}
              />
              <div className="sm-hidden xs-hidden">
                <LocalityLegend localities={localities} legendTitle="¿Dónde opera?" /><LocalityLegend localities={localities} legendTitle="¿Dónde opera?" />
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

OrganizationListScreenView.propTypes = {
  history: PropTypes.object.isRequired,
  organizations: PropTypes.object.isRequired,
  valState: PropTypes.array.isRequired,
  valMuni: PropTypes.array.isRequired,
  valSector: PropTypes.array.isRequired,
  valActionType: PropTypes.array.isRequired,
  fitBounds: PropTypes.array.isRequired,
}

OrganizationListScreenView.defaultProps = {
  valState: [],
  valMuni: [],
  valSector: [],
  valActionType: [],
  fitBounds: [[-99.5, 14.4], [-91.7, 19.9]],
}

// THIS IS AN ANTI-PATTERN, because it will rerender screen view on any change to redux store
const mapStateToProps = (state, { location }) => {
  const { valState, valMuni, valSector, valActionType } = parseFilterQueryParams(location)
  return { valState, valMuni, valSector, valActionType }
}

export default withRouter(connect(mapStateToProps, null)(OrganizationListScreenView))
