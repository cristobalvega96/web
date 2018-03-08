/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'

import moment from 'moment'
import ReactTable from 'react-table'
import Toggle from 'material-ui/Toggle'
import '!style-loader!css-loader!react-table/react-table.css'

import { tokenMatch, thumborUrl } from 'tools/string'
import SubmissionActionSelect from './SubmissionActionSelect'
import Styles from './SubmissionTable.css'


const pageSizeOptions = [5, 10, 20, 50]
const defaultFilterMethod = (filter, row) => {
  const id = filter.pivotId || filter.id
  return row[id] !== undefined ? tokenMatch(String(row[id]), filter.value) : true
}

const SubmissionTable = ({ submissions, onChangeAction, onTogglePublished, onRowClicked }) => {
  const columns = [
    {
      Header: 'Fotos',
      Cell: (props) => {
        const thumbs = (props.original.image_urls || []).map((url) => {
          return (
            <div
              key={url}
              className={Styles.thumbnail}
              style={{ backgroundImage: `url(${thumborUrl(url, 120, 120, true)})` }}
            />
          )
        })
        return <div className={Styles.thumbnailContainer}>{thumbs}</div>
      },
    },
    {
      Header: 'Descripción',
      accessor: 'description',
    },
    {
      Header: 'Creada',
      accessor: 'submitted',
      Cell: props => <span>{moment(props.original.submitted).format('h:mma, DD MMMM YYYY')}</span>,
    },
    {
      Header: '¿Publicar?',
      accessor: 'published',
      Cell: props => (<Toggle
        toggled={props.original.published}
        onToggle={(e, toggled) => onTogglePublished(props.original.id, toggled)}
      />),
    },
  ]

  if (onChangeAction) {
    columns.splice(3, 0, {
      Header: 'Proyecto',
      accessor: 'action_id',
      Cell: props => (<SubmissionActionSelect
        value={props.original.action_id}
        onChange={(event, key, payload) => onChangeAction(props.original.id, payload)}
        getterKey="accountActions"
      />),
    })
  }

  let pageSize = 5
  if (submissions.length > 5) pageSize = 10
  if (submissions.length > 10) pageSize = 20

  return (
    <ReactTable
      className="-highlight"
      pageSizeOptions={pageSizeOptions}
      defaultPageSize={pageSize}
      data={submissions}
      columns={columns}
      defaultFilterMethod={defaultFilterMethod}
      getTdProps={(state, rowInfo, column) => {
        const { id } = column
        return {
          onClick: (e, handleOriginal) => {
            if (id !== 'published' && rowInfo && onRowClicked) onRowClicked(rowInfo.original.id)
            if (handleOriginal) handleOriginal()
          },
          style: id !== 'published' && onRowClicked ? { cursor: 'pointer' } : {},
        }
      }}
    />
  )
}

SubmissionTable.propTypes = {
  submissions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onTogglePublished: PropTypes.func.isRequired,
  onChangeAction: PropTypes.func,
  onRowClicked: PropTypes.func,
}

export default SubmissionTable
