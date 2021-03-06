import React from 'react'
import PropTypes from 'prop-types'

import debounce from 'lodash/debounce'
import { reset } from 'redux-form'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'

import * as Actions from 'src/actions'
import service, { getBackoff } from 'api/service'
import { cleanAccentedChars } from 'tools/string'
import Modal from 'components/Modal'
import WithSideNav from 'components/WithSideNav'
import ProfileStrength from 'components/Strength/ProfileStrength'
import FormStyles from 'src/Form.css'
import { CreateActionForm, prepareActionBody } from 'screens/account/ActionForm'
import SubmissionTable from 'screens/account/SubmissionTable'
import ActionTable from 'screens/account/ActionTable'
import ActionTrash from 'screens/account/ActionTrash'
import SubmissionTrash from 'screens/account/SubmissionTrash'
import ContactForm from 'screens/account/ContactForm'
import PhotoGalleryPickerForm from 'screens/account/PhotoGalleryPickerForm'
import OrganizationForm from './OrganizationForm'


const initialActionValues = { published: true, progress: 0 }

class HomeScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      localitiesSearch: [],
      createActionModal: false,
      trashModal: false,
      submissionTrashModal: false,
    }

    this.handleLocalityChange = debounce(this.handleLocalityChange, 250)
  }

  componentDidMount() {
    document.title = 'Cuenta - Brigada'
    this.loadOrganization()
    this.loadActions()
    this.loadSubmissions()
  }

  loadProfileStrength = () => {
    getBackoff(service.accountGetProfileStrength, { key: 'profileStrength' })
  }

  loadOrganization = () => {
    getBackoff(service.accountGetOrganization, { key: 'accountOrganization' })
  }

  loadActions = () => {
    getBackoff(service.accountGetActions, { key: 'accountActions' })
  }

  loadSubmissions = () => {
    getBackoff(service.accountGetSubmissions, { key: 'accountSubmissions' })
  }

  handleSubmitOrganization = async (values) => {
    const { data } = await service.accountUpdateOrganization(values)
    if (!data) {
      this.props.snackbar('Hubo un error', 'error')
      return
    }
    this.loadOrganization()
    this.loadProfileStrength()
    this.props.snackbar('Actualizaste tu grupo', 'success')
  }

  handleSubmitContact = async ({ zip, city, state, street, locality, ...rest }) => {
    const { data } = await service.accountUpdateOrganization({ contact: {
      ...rest,
      address: { zip, city, state, street, locality },
    } })
    if (!data) {
      this.props.snackbar('Hubo un error', 'error')
      return
    }
    this.loadOrganization()
    this.loadProfileStrength()
    this.props.snackbar('Actualizaste tus datos de contacto', 'success')
  }

  handleCreateAction = async (body) => {
    const { data } = await service.accountCreateAction(prepareActionBody(body))
    if (!data) {
      this.props.snackbar('Hubo un error', 'error')
      return
    }
    this.props.resetAction()
    this.loadActions()
    this.loadProfileStrength()
    this.props.snackbar('Agregaste un nuevo proyecto', 'success')
    this.handleToggleCreateActionModal(false)
  }

  handleLocalityChange = async (e, v) => {
    if (v.value) {
      this.setState({ localitiesSearch: [] })
      return
    }
    const { data } = await service.getLocalitiesSearch(cleanAccentedChars(v.text), 10)
    if (!data) return
    this.setState({ localitiesSearch: data.results })
  }

  handleTogglePublished = async (id, key, published) => {
    const { data } = await service.accountUpdateAction(id, { published })
    if (!data) {
      this.props.snackbar(`Hubo un error, no se pudo ${published ? 'publicar' : 'ocultar'} este proyecto`, 'error')
      return
    }
    this.loadActions()
    this.loadProfileStrength()
    const message = published ? `Publicaste proyecto ${key}` : `Ocultaste proyecto ${key}`
    this.props.snackbar(message, 'success')
  }

  handleDeleteSubmission = async (id) => {
    const { data } = await service.accountArchiveSubmission(id, true)
    if (!data) {
      this.props.snackbar('Hubo un error', 'error')
      return
    }
    this.loadSubmissions()
    this.loadProfileStrength()
    this.props.snackbar('Mandaste estas fotos al basurero', 'success')
  }

  handleChangeSubmissionAction = async (id, actionId) => {
    const { snackbar, actions } = this.props
    const { data } = await service.accountUpdateSubmission(id, { action: actionId })
    if (!data) {
      snackbar('Hubo un error, no se pudo asignar estas fotos a un proyecto', 'error')
      return
    }
    this.loadSubmissions()
    this.loadProfileStrength()
    const action = actions.find(a => a.id === actionId)
    const message = `Asignaste estas fotos a proyecto ${action && action.key}`
    snackbar(message, 'success')
  }

  handleChooseImage = async (id, body) => {
    const { data } = await service.accountUpdateAction(id, body)
    if (!data) {
      this.props.snackbar('Hubo un error', 'error')
      return
    }
    this.loadActions()
    this.loadProfileStrength()
    this.handleToggleActionImageModal(undefined)
    this.props.snackbar('Actualizaste la imagen de este proyecto', 'success')
  }

  handleToggleCreateActionModal = (open) => {
    this.setState({ createActionModal: open })
  }

  handleToggleActionTrashModal = (open) => {
    this.setState({ trashModal: open })
  }

  handleToggleSubmissionTrashModal = (open) => {
    this.setState({ submissionTrashModal: open })
  }

  handleRestoreAction = () => {
    this.loadActions()
    this.loadProfileStrength()
  }

  handleRestoreSubmission = () => {
    this.loadSubmissions()
    this.loadProfileStrength()
  }

  handleToggleActionImageModal = (pickerActionId: ?number) => {
    this.setState({ pickerActionId })
  }

  render() {
    const { actions, submissions } = this.props
    const { createActionModal, trashModal, submissionTrashModal, pickerActionId } = this.state
    const pickerAction = actions.find(a => a.id === pickerActionId) || {}

    const content = (
      <div>
        <div className={FormStyles.card}>
          <div className={FormStyles.sectionHeader}>Mi organización</div>
          <OrganizationForm onSubmit={this.handleSubmitOrganization} enableReinitialize />
        </div>

        <div className={FormStyles.card}>
          <div className={FormStyles.sectionHeader}>Nuestro contacto</div>
          <div className={FormStyles.formContainerLeft}>
            <ContactForm
              form="accountContact"
              onSubmit={this.handleSubmitContact}
              enableReinitialize
              type="org"
            />
          </div>
        </div>

        <div className={FormStyles.card}>
          <div className={FormStyles.sectionHeader}>
            <span>Nuestros proyectos</span>
            <div>
              <span
                className={FormStyles.link}
                onClick={() => this.handleToggleActionTrashModal(true)}
              >
                Basurero
              </span>
              <RaisedButton
                backgroundColor="#3DC59F"
                labelColor="#ffffff"
                className={FormStyles.primaryButton}
                label="Agregar"
                onClick={() => this.handleToggleCreateActionModal(true)}
              />
            </div>
          </div>
          {actions.length > 0 &&
            <ActionTable
              actions={actions}
              onTogglePublished={this.handleTogglePublished}
              onClickImage={this.handleToggleActionImageModal}
            />
          }
        </div>

        <div className={FormStyles.card}>
          <div className={FormStyles.sectionHeader}>
            <span>Fotos sin proyecto</span>
            <span
              className={FormStyles.link}
              onClick={() => this.handleToggleSubmissionTrashModal(true)}
            >
              Basurero
            </span>
          </div>
          {submissions.length > 0 &&
            <SubmissionTable
              submissions={submissions}
              onDelete={this.handleDeleteSubmission}
              onChangeAction={this.handleChangeSubmissionAction}
            />
          }
        </div>

        {createActionModal &&
          <Modal
            contentClassName={`${FormStyles.modal} ${FormStyles.formContainerLeft}`}
            onClose={() => this.handleToggleCreateActionModal(false)}
            gaName="createActionModal"
          >
            <div className={FormStyles.sectionHeader}>Agregar proyecto</div>
            <CreateActionForm
              onSubmit={this.handleCreateAction}
              initialValues={initialActionValues}
              onLocalityChange={this.handleLocalityChange}
              localitiesSearch={this.state.localitiesSearch}
            />
          </Modal>
        }

        {trashModal &&
          <Modal
            contentClassName={`${FormStyles.modal} ${FormStyles.formContainer}`}
            onClose={() => this.handleToggleActionTrashModal(false)}
            gaName="actionTrashModal"
          >
            <ActionTrash onRestore={this.handleRestoreAction} />
          </Modal>
        }

        {submissionTrashModal &&
          <Modal
            contentClassName={`${FormStyles.modal} ${FormStyles.formContainer}`}
            onClose={() => this.handleToggleSubmissionTrashModal(false)}
            gaName="submissionTrashModal"
          >
            <SubmissionTrash onRestore={this.handleRestoreSubmission} />
          </Modal>
        }

        {pickerActionId !== undefined &&
          <Modal
            contentClassName={FormStyles.modal}
            onClose={() => this.handleToggleActionImageModal(undefined)}
            gaName="chooseActionImageModal"
          >
            <PhotoGalleryPickerForm
              actionId={pickerActionId}
              onSubmit={(body) => { this.handleChooseImage(pickerActionId, body) }}
              form={`accountActionPickPhoto_${pickerActionId}`}
              enableReinitialize
              initialValues={{ preview: pickerAction.preview }}
            />
          </Modal>
        }
      </div>
    )
    return <WithSideNav sticky={false} navComponents={<ProfileStrength />}>{content}</WithSideNav>
  }
}

HomeScreen.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  submissions: PropTypes.arrayOf(PropTypes.object).isRequired,
  snackbar: PropTypes.func.isRequired,
  resetAction: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  let actions = []
  let submissions = []

  try {
    actions = state.getter.accountActions.data.results || []
  } catch (e) {}
  try {
    submissions = (state.getter.accountSubmissions.data.results || []).sort((a, b) => {
      if (a.published < b.published) return 1
      if (a.published > b.published) return -1
      if (a.submitted < b.submitted) return 1
      if (a.submitted > b.submitted) return -1
      return 0
    })
  } catch (e) {}

  return { actions, submissions }
}

const mapDispatchToProps = (dispatch) => {
  return {
    snackbar: (message, status) => Actions.snackbar(dispatch, { message, status }),
    resetAction: () => dispatch(reset('accountNewAction')),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)
