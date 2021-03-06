// @flow

// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { Table, Tag } from 'antd';

import RelativeDate from '../../common/RelativeDate';
import TraceName from '../../common/TraceName';
import { fetchedState } from '../../../constants';
import { formatDuration } from '../../../utils/date';

import type { FetchedTrace } from '../../../types';

import './CohortTable.css';

type Props = {
  selection: {
    [string]: { label: string },
  },
  current: ?string,
  cohort: FetchedTrace[],
  selectTrace: string => void,
};

const { Column } = Table;

const defaultRowSelection = {
  hideDefaultSelections: true,
  type: 'radio',
};

const NEED_MORE_TRACES_MESSAGE = (
  <h3 key="msg" className="CohortTable--needMoreMsg">
    Enter a Trace ID or perform a search and select from the results.
  </h3>
);

export default class CohortTable extends React.PureComponent<Props> {
  props: Props;

  getCheckboxProps = (record: FetchedTrace) => {
    const { current, selection } = this.props;
    const { id, state } = record;
    if (state === fetchedState.ERROR || (id in selection && id !== current)) {
      return { disabled: true };
    }
    return {};
  };

  render() {
    const { cohort, current, selection, selectTrace } = this.props;
    const rowSelection = {
      ...defaultRowSelection,
      getCheckboxProps: this.getCheckboxProps,
      onChange: ids => selectTrace(ids[0]),
      selectedRowKeys: current ? [current] : [],
    };

    return [
      <Table
        key="table"
        size="middle"
        dataSource={cohort}
        rowKey="id"
        pagination={false}
        rowSelection={rowSelection}
      >
        <Column
          key="traceID"
          title=""
          dataIndex="id"
          render={value => <span className="u-tx-muted">{value && value.slice(0, 7)}</span>}
        />
        <Column
          key="traceName"
          title="Service &amp; Operation"
          sortOrder="descend"
          dataIndex="data.traceName"
          render={(_, record) => {
            const { data, error, id, state } = record;
            const { traceName } = data || {};
            const { label } = selection[id] || {};
            return (
              <React.Fragment>
                {label != null && (
                  <Tag key="lbl" className="ub-bold" color="#139999">
                    {label}
                  </Tag>
                )}
                <TraceName
                  key="name"
                  className="CohortTable--traceName"
                  error={error}
                  state={state}
                  traceName={traceName}
                />
              </React.Fragment>
            );
          }}
        />
        <Column
          title="Date"
          dataIndex="data.startTime"
          key="lastName"
          render={(value, record) =>
            record.state === fetchedState.DONE && (
              <RelativeDate fullMonthName includeTime value={value / 1000} />
            )
          }
        />
        <Column
          title="Duration"
          dataIndex="data.duration"
          key="age"
          render={(value, record) => record.state === fetchedState.DONE && formatDuration(value)}
        />
        <Column title="Spans" dataIndex="data.spans.length" key="address" />
      </Table>,
      cohort.length < 2 && NEED_MORE_TRACES_MESSAGE,
    ];
  }
}
