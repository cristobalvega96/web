/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'

import ReactTable from 'react-table'
import Toggle from 'material-ui/Toggle'
import { withRouter, Link } from 'react-router-dom'
import '!style-loader!css-loader!react-table/react-table.css'

import { tokenMatch } from 'tools/string'
import FormStyles from 'src/Form.css'
import Styles from './DonationTable.css'


const pageSizeOptions = [5, 10, 20, 50]
const defaultFilterMethod = (filter, row) => {
  const id = filter.pivotId || filter.id
  return row[id] !== undefined ? tokenMatch(String(row[id]), filter.value) : true
}

const DonationTable = ({ donations, onToggleApproved, history }) => {
  const columns = [
    {
      Header: 'ID',
      accessor: 'id',
    },
    {
      Header: 'Org',
      accessor: 'action.organization_id',
      Cell: (props) => {
        const { organization_id: orgId } = props.original.action
        return <Link className={Styles.link} to={`/organizaciones/${orgId}`}>{orgId}</Link>
      },
    },
    {
      Header: 'Monto MXN',
      accessor: 'amount',
    },
    {
      Header: 'Fecha recibida',
      accessor: 'received_date',
    },
    {
      Header: 'Descripción',
      accessor: 'desc',
      Cell: props => props.original.desc,
    },
    {
      Header: '¿Aprobada por org?',
      accessor: 'approved_by_org',
      Cell: props => (<Toggle
        disabled
        toggled={props.original.approved_by_org}
      />),
    },
  ]
  if (onToggleApproved) {
    columns.push({
      Header: '¿Aprobar?',
      accessor: 'approved_by_donor',
      Cell: props => (<Toggle
        toggled={props.original.approved_by_donor}
        onToggle={(e, toggled) => onToggleApproved(props.original.id, toggled)}
      />),
    })
  }

  let pageSize = 5
  if (donations.length > 5) pageSize = 10
  if (donations.length > 10) pageSize = 20

  return (
    <ReactTable
      className="-highlight"
      pageSizeOptions={pageSizeOptions}
      defaultPageSize={pageSize}
      data={donations}
      columns={columns}
      defaultFilterMethod={defaultFilterMethod}
      getTdProps={(state, rowInfo, column) => {
        const { id } = column
        const handleRowClicked = (e, handleOriginal) => {
          if (id !== 'approved' && id !== 'action.organization_id' && rowInfo) {
            history.push(`/donador/donaciones/${rowInfo.original.id}`)
          }
          if (handleOriginal) handleOriginal()
        }
        return {
          onClick: handleRowClicked,
          style: id !== 'approved' ? { cursor: 'pointer' } : {},
        }
      }}
    />
  )
}

DonationTable.propTypes = {
  donations: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleApproved: PropTypes.func,
  history: PropTypes.object.isRequired,
}

export default withRouter(DonationTable)
