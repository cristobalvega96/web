/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import pure from 'recompose/pure'

import ReactTable from 'react-table'
import Toggle from 'material-ui/Toggle'
import Checkbox from 'material-ui/Checkbox'
import { withRouter, Link } from 'react-router-dom'
import '!style-loader!css-loader!react-table/react-table.css'

import { tokenMatch } from 'tools/string'
import Styles from './DonorDonationTable.css'


const defaultFilterMethod = (filter, row) => {
  const id = filter.pivotId || filter.id
  return row[id] !== undefined ? tokenMatch(String(row[id]), filter.value) : true
}

const DonorDonationTable = ({ donations, onToggleApproved, history }) => {
  const columns = [
    {
      Header: 'ID',
      accessor: 'id',
    },
    {
      Header: 'Proyecto',
      accessor: 'action.organization.id',
      Cell: (props) => {
        const { key, organization: { id, name } } = props.original.action
        return <Link className={Styles.link} to={`/reconstructores/${id}`}>{name}, {key}</Link>
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
      Header: '¿Aprobada por org?',
      accessor: 'approved_by_org',
      Cell: props => (<Checkbox
        disabled
        checked={props.original.approved_by_org}
        labelPosition="left"
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

  return (
    <ReactTable
      className="-highlight"
      pageSize={donations.length}
      showPagination={false}
      data={donations}
      columns={columns}
      defaultFilterMethod={defaultFilterMethod}
      getTdProps={(state, rowInfo, column) => {
        const { id } = column
        const handleRowClicked = (e, handleOriginal) => {
          if (id !== 'approved_by_donor' && id !== 'action.organization.id' && rowInfo) {
            history.push(`/donador/donativos/${rowInfo.original.id}`)
          }
          if (handleOriginal) handleOriginal()
        }
        return {
          onClick: handleRowClicked,
          style: !['approved_by_donor', 'action.organization.id'].includes(id) ? { cursor: 'pointer' } : {},
        }
      }}
    />
  )
}

DonorDonationTable.propTypes = {
  donations: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleApproved: PropTypes.func,
  history: PropTypes.object.isRequired,
}

export default withRouter(pure(DonorDonationTable))
