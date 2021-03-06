import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import { Spinner } from 'office-ui-fabric-react/lib-es2015/Spinner';
import {
  CommandBarButton,
  PrimaryButton,
  DefaultButton,
} from 'office-ui-fabric-react/lib-es2015/Button';
import { Modal } from 'office-ui-fabric-react/lib-es2015/Modal';
import {
  Dialog,
  DialogType,
  DialogFooter,
} from 'office-ui-fabric-react/lib/Dialog';
import autobind from 'react-autobind';
import { updateItemById } from 'redux-toolbelt-immutable-helpers';
import EditUser from './EditUser';
import PendingInvitationList from './PendingInvitationList';

class UserList extends Component {
  constructor(...args) {
    super(...args);
    autobind(this);
    this.state = {
      tableExpansion: {},
      showModal: false,
      modalType: null,
      selectedRowIndex: undefined,
      congregations: null,
      users: null,
    };
  }

  async componentDidMount() {
    const [users, congregations] = await Promise.all([
      fetch('/users', { credentials: 'same-origin' }).then((response) => response.json()),
      fetch('/congregations', { credentials: 'same-origin' }).then((response) => response.json())
    ]);

    congregations.sort((a, b) => a.name.localeCompare(b.name));
    this.setState({ users, congregations });
  }

  async updateUser(user, index) {
    this.setState(({ tableExpansion }) => ({
      tableExpansion: { ...tableExpansion, [index]: false },
    }));
  }

  async onSubmitInvitation(user) {
    user.roles = (user.roles && user.roles[0] == true) ? ['admin'] : [];
    this.updateUser(user);
    this.setState({ showModal: false, modalType: null });

    const response = await fetch('/auth/invitations', {
      method: 'POST',
      body: JSON.stringify({
        ...user,
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      credentials: 'same-origin',
    });

    if (response.status === 200 || response.status === 201) {
      window.location.reload(true);
    }
  }

  async onSubmitUser(user) {
    user.roles = (user.roles && (user.roles[0] == true || user.roles[0] === 'admin')) ? ['admin'] : [];
    this.updateUser(user);
    this.setState({ showModal: false, modalType: null });

    const response = await fetch(`/users/${user.userId}`, {
      method: 'PUT',
      body: JSON.stringify(user),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      credentials: 'same-origin',
    });

    user = await response.json();
    this.setState(({ users }) => ({
      users: updateItemById(users, user.userId, user, x => x.userId),
    }));
  }

  async deleteUser() {
    this.hideDialog();

    const { users, selectedRowIndex } = this.state;
    const user = users[selectedRowIndex];

    if (!user) {
      return;
    }

    const response = await fetch(`/users/${user.userId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    if (response.status === 200) {
      this.setState(({ users }) => ({
        users: users.filter(x => x.userId !== user.userId),
      }));
    } else {
      window.alert('Error deleting invitation');
    }
  }

  showDialog() {
    this.setState({ showDialog: true });
  }

  render() {
    const { users, congregations, selectedRowIndex, modalType } = this.state;
    const { congregationId, isAdmin } = this.props
    if (!users || !congregations) {
      return <Spinner />;
    }

    const isRowSelected =
      selectedRowIndex > -1 &&
      selectedRowIndex !== null &&
      selectedRowIndex !== undefined;

    return (
      <div>
        <h5>Active Users</h5>
        <div style={{ display: 'flex', alignItems: 'stretch', height: '40px' }}>
          <CommandBarButton
            iconProps={{ iconName: 'AddFriend' }}
            text="Invite a new user"
            onClick={() =>
              this.setState({ showModal: true, modalType: 'invitation' })
            }
          />
          <CommandBarButton
            disabled={!isRowSelected}
            iconProps={{ iconName: 'Edit' }}
            text="Edit"
            onClick={() =>
              this.setState({ showModal: true, modalType: 'editUser' })
            }
          />
        </div>

        <ReactTable
          data={users}
          columns={[
            { accessor: 'email', Header: 'Email' },
            { accessor: 'name', Header: 'Name' },
            {
              accessor: 'congregationId',
              Header: 'Congregation',
              show: isAdmin,
              Cell({ value }) {
                const congregation = congregations.find(c => c.congregationId == value);
                return (congregation && congregation.name) || '';
              }
            },
            {
              accessor: 'isActive',
              Header: 'Active',
              Cell({ value }) {
                return value.toString();
              },
            },
            {
              accessor: 'roles',
              Header: 'Roles',
              Cell({ row: { roles } }) {
                return roles && roles.join(', ');
              },
            },
          ]}
          defaultPageSize={10}
          className="-striped -highlight"
          getTdProps={(state, rowInfo, column, instance) => {
            if (!rowInfo) {
              return {};
            }

            const rowSelected = this.state.selectedRowIndex === rowInfo.index;
            return {
              onClick: (e, handleOriginal) => {
                this.setState(
                  { selectedRowIndex: rowSelected ? null : rowInfo.index },
                  handleOriginal,
                );
              },
              className: rowSelected ? 'ms-bgColor-themeTertiary' : 'undefined',
            };
          }}
          minRows={1}
        />

        <Modal
          isOpen={this.state.showModal}
          onDismiss={() => this.setState({ showModal: false, modalType: null })}
          isBlocking={false}
          containerClassName="pad"
        >
          {modalType === 'invitation' && (
            <EditUser type="invitation"
              isAdmin={isAdmin}
              congregations={congregations}
              user={{ congregationId }}
              onSubmit={this.onSubmitInvitation} />
          )}
          {modalType === 'editUser' && (
            <EditUser
              type="edit"
              isAdmin={isAdmin}
              congregations={congregations}
              onSubmit={this.onSubmitUser}
              user={users[selectedRowIndex]}
            />
          )}
        </Modal>

        <Dialog
          hidden={!this.state.showDialog}
          onDismiss={this.hideDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Delete this user?',
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'ms-dialogMainOverride',
          }}
        >
          <DialogFooter>
            <PrimaryButton onClick={this.deleteUser} text="Yes" />
            <DefaultButton onClick={this.hideDialog} text="No" />
          </DialogFooter>
        </Dialog>

        <h5>Invitations</h5>
        <PendingInvitationList congregations={congregations} isAdmin={isAdmin} {...this.props} />
      </div>
    );
  }
}

UserList.propTypes = {
  congregationId: PropTypes.number,
  isAdmin: PropTypes.bool
};

export default UserList;
