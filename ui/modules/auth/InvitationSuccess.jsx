import React, { Component } from 'react';
import autobind from 'react-autobind';
import { Form, Text, Radio, RadioGroup, Select, Checkbox } from 'react-form';
import parseQuery from '../../utils/parseQuery';

class InvitationSuccess extends Component {
  constructor(...args) {
    super(...args);
    autobind(this);

    this.state = { registrationError: false, loading: false, success: false };
  }

  render() {
    return (
      <div>
        <div className="ms-fontSize-xl">
          <i class="ms-Icon ms-Icon--Balloons" aria-hidden="true" /> Hi,{' '}
          {parseQuery().name}!
        </div>
        <div className="ms-fontSize-l">
          To finish, just <a href="/ui/login">Login</a>.
        </div>

        <meta http-equiv="refresh" content="5;/ui/login" />
      </div>
    );
  }
}

export default InvitationSuccess;
