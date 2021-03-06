import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import * as Actions from 'src/actions'
import service from 'api/service'
import VolunteerApplicationForm from './VolunteerApplicationForm'


const VolunteerApplicationScreen = ({ snackbar, modal, className = '', position, id, name, onLogin, brigada }) => {
  const handleSubmit = async (body) => {
    const { data, status } = await service.createVolunteerApplication({ ...body, opportunity_id: id })
    if (data) {
      onLogin(data.user)
      modal('volunteerApplicationCreated', { position, name, modalWide: true })
      return
    }

    if (status === 400) snackbar('Hubo un error', 'error')
    else snackbar('Checa tu conexión', 'error')
  }

  const form = <VolunteerApplicationForm initialValues={brigada} position={position} onSubmit={handleSubmit} />
  if (!className) return form
  return <div className={className}>{form}</div>
}

VolunteerApplicationScreen.propTypes = {
  snackbar: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
  position: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  brigada: PropTypes.object.isRequired,
  modal: PropTypes.func.isRequired,
  className: PropTypes.string,
}

const mapStateToProps = (state) => {
  const { brigada = {} } = state.auth
  return { brigada }
}

const mapDispatchToProps = (dispatch) => {
  return {
    snackbar: (message, status, duration) => Actions.snackbar(dispatch, { message, status, duration }),
    modal: (modalName, props) => Actions.modal(dispatch, modalName, props),
    onLogin: auth => Actions.authSet(dispatch, { auth, type: 'brigada' }),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(VolunteerApplicationScreen)
