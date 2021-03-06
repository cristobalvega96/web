/* eslint-disable camelcase */
import React from 'react'
import PropTypes from 'prop-types'

import moment from 'moment'
import { reduxForm, propTypes as rxfPropTypes } from 'redux-form'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'
import AutoCompleteMui from 'material-ui/AutoComplete'

import { TextField, Toggle, DatePicker, AutoComplete, Checkbox } from 'components/Fields'
import { validateEmail } from 'tools/string'
import service, { getBackoff } from 'api/service'
import ConfirmButton from 'components/ConfirmButton'
import FormStyles from 'src/Form.css'


class Fields extends React.Component {
  componentDidMount() {
    getBackoff(service.getDonorsMini, { key: 'miniDonors' })
  }

  render() {
    const { donors, has_user: donorHasUser, id: donationId } = this.props

    const dataSource = donors.map((d) => {
      const { id, name, has_user } = d
      return { text: name, value: id, has_user }
    })
    const formatDatePicker = value => value || null
    const formatAutoComplete = (value) => {
      try {
        return value.text
      } catch (e) {
        return value || ''
      }
    }
    const normalizeAutoComplete = (value) => {
      if (!value) return { value: '', text: '' }
      if (typeof value === 'string') return { value: '', text: value }
      return value
    }

    return (
      <React.Fragment>
        <div className={FormStyles.row}>
          <AutoComplete
            className={FormStyles.wideInput}
            floatingLabelText="Donador"
            name="donor"
            dataSource={dataSource}
            fullWidth
            filter={AutoCompleteMui.fuzzyFilter}
            format={formatAutoComplete}
            normalize={normalizeAutoComplete}
          />
        </div>
        {(!donorHasUser && donationId === undefined) &&
          <div className={FormStyles.row}>
            <TextField
              className={FormStyles.wideInput}
              name="contact_email"
              hintText="Email de contacto para donador"
              autoCapitalize="off"
            />
          </div>
        }
        <div className={FormStyles.row}>
          <TextField
            type="number"
            min="0"
            floatingLabelText="Monto donado MXN"
            name="amount"
            normalize={(value) => { return value ? parseInt(value, 10) : null }}
          />
          <DatePicker
            floatingLabelText="Fecha cuando se recibió el donativo"
            name="received_date"
            format={formatDatePicker}
          />
        </div>
        <div className={FormStyles.row}>
          <div className={FormStyles.toggle}>
            <Toggle
              label="¿Aprobada por tí?"
              name="approved_by_org"
            />
          </div>
        </div>
        <div className={FormStyles.row}>
          <div className={FormStyles.toggle}>
            <Checkbox
              label="¿Aprobada por donador?"
              name="approved_by_donor"
              labelPosition="left"
              disabled
            />
          </div>
        </div>
      </React.Fragment>
    )
  }
}

Fields.propTypes = {
  donors: PropTypes.arrayOf(PropTypes.object).isRequired,
  has_user: PropTypes.bool,
  id: PropTypes.number,
}

const mapStateToProps = (state, { id: donationId }) => {
  let donors = []
  let has_user = true

  try {
    donors = state.getter.miniDonors.data.results
  } catch (e) {}
  try {
    if (donationId === undefined) ({ has_user } = state.form.orgNewDonation.values.donor)
  } catch (e) {}

  return { donors, has_user }
}

const ReduxFields = connect(mapStateToProps, null)(Fields)

const CreateForm = ({ handleSubmit, submitting }) => {
  return (
    <React.Fragment>
      <ReduxFields />
      <div className={FormStyles.row}>
        <RaisedButton
          backgroundColor="#3DC59F"
          labelColor="#ffffff"
          className={FormStyles.primaryButton}
          disabled={submitting}
          label="Agregar"
          onClick={handleSubmit}
        />
      </div>
    </React.Fragment>
  )
}

CreateForm.propTypes = {
  ...rxfPropTypes,
}

const UpdateForm = ({ handleSubmit, submitting, onDelete, id }) => {
  return (
    <React.Fragment>
      <ReduxFields id={id} />
      <div className={FormStyles.row}>
        <RaisedButton
          backgroundColor="#3DC59F"
          labelColor="#ffffff"
          className={FormStyles.primaryButton}
          disabled={submitting}
          label="ACTUALIZAR"
          onClick={handleSubmit}
        />
        <ConfirmButton
          className={FormStyles.button}
          disabled={submitting}
          text="Borrar"
          onConfirm={onDelete}
        />
      </div>
    </React.Fragment>
  )
}

UpdateForm.propTypes = {
  ...rxfPropTypes,
  onDelete: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
}

const validate = ({ id, donor, contact_email }) => {
  const errors = {}
  if (id) {
    if (!donor || !donor.value) errors.donor = 'Escoge un donador de la lista'
  } else if (!donor || (!donor.value && !donor.text)) {
    errors.donor = 'Escoge un donador de la lista, o ingresa un nuevo donador'
  }
  if (donor && !donor.has_user && !validateEmail(contact_email)) {
    errors.contact_email = 'Agrega un email de contacto válido para este donador'
  }
  return errors
}

export const prepareDonationBody = (body) => {
  const { donor, received_date: date } = body
  const prepared = {
    ...body,
    donor: donor.value,
    donor_name: donor.text,
    received_date: date ? moment(date).format('YYYY-MM-DD') : null,
  }
  if (donor.value) prepared.donor_id = donor.value
  return prepared
}

export const prepareInitialDonationValues = (values) => {
  const {
    received_date: date,
    donor: { id, name },
  } = values
  return {
    ...values,
    received_date: date && moment(date).toDate(),
    donor: { text: name, value: id },
  }
}

const ReduxCreateForm = reduxForm({ form: 'orgNewDonation', validate })(CreateForm)
const ReduxUpdateForm = reduxForm({ validate })(UpdateForm) // pass `form` arg when instantiating form
export { ReduxCreateForm as CreateDonationForm, ReduxUpdateForm as UpdateDonationForm }
