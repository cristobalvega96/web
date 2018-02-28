import React from 'react'
import PropTypes from 'prop-types'

import { withRouter } from 'react-router-dom'
import { reduxForm, propTypes as rxfPropTypes } from 'redux-form'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'

import * as Actions from 'src/actions'
import service from 'api/service'
import { parseQs } from 'tools/string'
import { TextField } from 'components/Fields'
import Styles from 'screens/account/Form.css'


const Form = ({ handleSubmit, submitting }) => {
  return (
    <div className={Styles.formContainer}>
      <div>
        <TextField
          type="password"
          name="password"
          hintText="Contraseña"
        />
      </div>
      <div>
        <TextField
          type="password"
          name="confirmPassword"
          hintText="Confirmar contraseña"
        />
      </div>
      <RaisedButton className={Styles.button} disabled={submitting} label="RESTABLECER" onClick={handleSubmit} />
    </div>
  )
}

Form.propTypes = {
  ...rxfPropTypes,
}

const validate = ({ password, confirmPassword }) => {
  const errors = {}
  if (password !== undefined && password.length < 8) errors.password = 'Debe tener al menos 8 caracteres'
  if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas tienen que ser iguales'
  return errors
}

const ReduxForm = reduxForm({ form: 'setPasswordWithToken', validate })(Form)

const SetPasswordWithTokenScreen = ({ history, location, snackbar }) => {
  const handleSubmit = async ({ password }) => {
    const params = parseQs(location.search)
    const { token = '' } = params

    const { data } = await service.setPasswordWithToken(token, password)
    if (!data) {
      snackbar('El email que te mandamos ya no es válido, pide otro', 'error')
      return
    }
    history.push('/cuenta')
    snackbar('Cambiaste tu contraseña', 'success')
  }

  return <ReduxForm onSubmit={handleSubmit} />
}

SetPasswordWithTokenScreen.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  snackbar: PropTypes.func.isRequired,
}

const mapDispatchToProps = (dispatch) => {
  return {
    snackbar: (message, status) => Actions.snackbar(dispatch, { message, status }),
  }
}

export default withRouter(connect(null, mapDispatchToProps)(SetPasswordWithTokenScreen))