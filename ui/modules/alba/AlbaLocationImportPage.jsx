import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autobind from 'react-autobind';
import axios from 'axios';
import Import from './locationImport/Import';
import SessionController from './SessionController';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import PreImport from './locationImport/PreImport';
import TSVCollector from './locationImport/TSVCollector';
import Wizard from '../layouts/Wizard';

class AlbaLocationImportPage extends Component {
  constructor(props) {
    super(props);
    autobind(this);

    this.state = {};
  }

  async submitLocations(e) {
    e.preventDefault();

    this.setState({ loading: true });
    const { locations: body } = this.state;

    try {
      const { data } = await axios.post('/alba/session', { payload: body });
      this.setState({ loading: false, session: data });
      this.props.history.push('/review');
      Materialize.toast('Locations successfully imported.', 5000);
    } catch (ex) {
      this.setState({ loading: false, error: ex });
      Materialize.toast(`Error importing locations. ${ex}`, 5000);
    }
  }

  render() {
    const { congregationId, history, location } = this.props;
    return (
      <Wizard
        title="Alba"
        steps={[
          {
            id: 'start',
            name: 'Copy Alba Data',
            render: props => <TSVCollector congregationId={congregationId} {...props} />,
          },
          {
            id: 'prepare',
            name: 'Congregations & Languages',
            render: props => <PreImport {...props} />,
          },
          {
            id: 'import',
            name: 'Upload Locations',
            render: props => (
              <SessionController>
                {({ session, error, loading, ...callbacks }) => {
                  if (loading) {
                    return <Spinner />;
                  }

                  if (error) {
                    return <MessageBar messageBarType={MessageBarType.error} isMultiline>{error}</MessageBar>;
                  }

                  return <Import {...session} {...callbacks} {...props} />;
                }}
              </SessionController>
            )
          },
        ]}
      />
    );
  }
}

AlbaLocationImportPage.propTypes = {
  congregationId: PropTypes.number.isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    url: PropTypes.string.isRequired,
  }).isRequired,
};

export default AlbaLocationImportPage;
