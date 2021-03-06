import React from 'react'
import PropTypes from 'prop-types'

import { reduxForm, propTypes as rxfPropTypes } from 'redux-form'
import { connect } from 'react-redux'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

import * as Actions from 'src/actions'
import service, { getBackoff } from 'api/service'
import { projectTypeByValue } from 'src/choices'
import { roundTo } from 'tools/string'
import TextLegend from 'components/FeatureMap/TextLegend'
import LoadingIndicatorCircle from 'components/LoadingIndicator/LoadingIndicatorCircle'
import ChooseLocationMap from 'components/FeatureMap/ChooseLocationMap'
import { TextField, Toggle, SelectField, DatePicker } from 'components/Fields'
import FormStyles from 'src/Form.css'
import Styles from './TestimonialForm.css'


const UpdateForm = ({ handleSubmit, submitting, actionSearch = [], location, onLocationClick }) => {
  const actions = actionSearch.map((a) => {
    const { id, key, action_type: type, desc } = a
    return { label: `${key} — ${projectTypeByValue[type] || '?'} — ${desc}`, value: id }
  })

  const formatDatePicker = value => value || null

  return (
    <React.Fragment>
      <div className={FormStyles.row}>
        <SelectField
          className={FormStyles.wideInput}
          floatingLabelText="Proyecto"
          name="action_id"
        >
          {actions.map(({ value, label }) => {
            return <MenuItem key={value} value={value} primaryText={label} />
          })}
        </SelectField>
      </div>
      <div className={FormStyles.row}>
        <DatePicker
          floatingLabelText="Fecha cuando se grabó el vídeo"
          name="submitted"
          format={formatDatePicker}
        />
        {location &&
          <React.Fragment>
            <span>{`Ubicación: ${roundTo(location.lat, 5)}, ${roundTo(location.lng, 5)}`}</span>
            <span className={Styles.locationButton} onClick={onLocationClick}>Editar</span>
          </React.Fragment>
        }
      </div>
      <div className={FormStyles.row}>
        <TextField
          className={FormStyles.wideInput}
          name="recipients"
          hintText="Nombre(s) de las persona beneficiadas, separados por comas"
        />
      </div>

      <div className={FormStyles.toggle}>
        <Toggle
          label="¿Publicado?"
          name="published"
        />
      </div>
      <div className={FormStyles.row}>
        <RaisedButton
          className={FormStyles.button}
          disabled={submitting}
          label="GUARDAR"
          onClick={handleSubmit}
        />
      </div>
    </React.Fragment>
  )
}

UpdateForm.propTypes = {
  ...rxfPropTypes,
  actionSearch: PropTypes.arrayOf(PropTypes.object).isRequired,
  onLocationClick: PropTypes.func.isRequired,
  location: PropTypes.object,
}

export const prepareInitialValues = ({ submitted, ...rest }) => {
  return {
    ...rest,
    submitted: submitted && new Date(submitted),
  }
}

export const prepareBody = (body) => {
  const { action_id: id, ...rest } = body
  return {
    ...rest,
    action: id,
  }
}

const validate = ({ submitted, recipients }) => {
  const errors = {}
  if (!submitted) errors.submitted = 'Agrega la fecha cuando se grabó el testimonio'
  if (!recipients) errors.recipients = 'Agrega los nombre(s) de la personas beneficiadas, separados por comas'
  return errors
}

const ReduxUpdateForm = reduxForm({ validate })(UpdateForm)

class TestimonialFormWrapper extends React.Component {
  state = {
    editingLocation: false,
  }

  componentDidMount() {
    this.loadActionsForSearch()
    this.loadTestimonial()
  }

  loadActionsForSearch = () => {
    getBackoff(service.accountGetActionsMinimal, { key: 'accountActionsMinimal' })
  }

  loadTestimonial = () => {
    const { testimonialId } = this.props
    getBackoff(
      () => { return service.accountGetTestimonial(testimonialId) },
      { key: `accountTestimonial_${testimonialId}` }
    )
  }

  handleSubmit = async (values) => {
    const { snackbar, onChange } = this.props
    const body = prepareBody(values)
    const { data } = await service.accountUpdateTestimonial(this.props.testimonialId, body)
    if (!data) {
      snackbar('Hubo un error', 'error')
      return
    }
    this.loadTestimonial()
    if (onChange) onChange()
    this.props.snackbar('Actualizaste este testimonio', 'success')
  }

  handleLocationClick = () => {
    this.setState({ editingLocation: true })
  }

  handleLocationChange = ({ lat, lng }) => {
    this.setState({ location: { lat, lng } })
  }

  handleLocationSubmit = async () => {
    await this.handleSubmit({ location: this.state.location }, false)
    this.setState({ editingLocation: false })
  }

  handleLocationCancel = () => {
    this.setState({ editingLocation: false })
  }

  render() {
    const { testimonial, actions, testimonialId } = this.props
    const { location } = testimonial
    const { editingLocation } = this.state
    if (!testimonial.id) return <LoadingIndicatorCircle className={Styles.loader} />

    if (editingLocation && location) {
      return (
        <div className={FormStyles.formContainerLeft}>
          <ChooseLocationMap
            className={Styles.mapContainer}
            onLocationChange={this.handleLocationChange}
            coordinates={[location.lng, location.lat]}
            legend={<TextLegend text="UBICACIÓN DE LAS FOTOS" />}
          />
          <div className={FormStyles.row}>
            <RaisedButton
              backgroundColor="#3DC59F"
              labelColor="#ffffff"
              className={FormStyles.primaryButton}
              label="GUARDAR"
              onClick={this.handleLocationSubmit}
            />
            <FlatButton
              className={Styles.locationBackButton}
              label="CANCELAR"
              onClick={this.handleLocationCancel}
            />
          </div>
        </div>
      )
    }

    return (
      <React.Fragment>
        <div className={FormStyles.formContainerLeft}>
          <ReduxUpdateForm
            onSubmit={this.handleSubmit}
            initialValues={prepareInitialValues(testimonial)}
            location={testimonial.location}
            testimonialId={testimonialId}
            actionSearch={actions}
            form={`accountUpdateTestimonial_${testimonialId}`}
            onLocationClick={this.handleLocationClick}
            enableReinitialize
          />
        </div>
      </React.Fragment>
    )
  }
}

TestimonialFormWrapper.propTypes = {
  testimonialId: PropTypes.number.isRequired,
  testimonial: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  snackbar: PropTypes.func.isRequired,
  onChange: PropTypes.func,
}

const mapStateToProps = (state, { testimonialId }) => {
  let testimonial = {}
  let actions = []

  try {
    testimonial = { ...state.getter[`accountTestimonial_${testimonialId}`].data }
    if (testimonial.action) testimonial.action_id = testimonial.action.id
  } catch (e) {}
  try {
    actions = state.getter.accountActionsMinimal.data.results.sort((a, b) => {
      if (a.key < b.key) return 1
      if (a.key > b.key) return -1
      return 0
    })
  } catch (e) {}

  return { testimonial, actions }
}

const mapDispatchToProps = (dispatch) => {
  return {
    snackbar: (message, status) => Actions.snackbar(dispatch, { message, status }),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TestimonialFormWrapper)
