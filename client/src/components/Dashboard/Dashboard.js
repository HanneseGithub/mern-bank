import React from 'react';
import { Col, Row, Form, UncontrolledAlert, Navbar, NavbarText, Nav, NavItem, Button } from 'reactstrap';

import './Dashboard.css'

import BalanceScreen from '../BalanceScreen/BalanceScreen'
import CustomFormGroup from '../FormComponents/CustomFormGroup/CustomFormGroup'

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: 0,
      deposit: 0,
      withdraw: 0,
      firstname: '',
      accountFrom: '',
      accountTo: '',
      amount: 0,
      transferCompleted: '',
    }
    this.handleChange = this.handleChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onTransferSubmit = this.onTransferSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchBalance()
  }

  fetchBalance() {
    fetch("https://smallbank-api.herokuapp.com/balance", {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(json =>
        this.setState({
          balance : json.balance,
          firstname: json.firstname
        })
      )
    //   .then(text => {
    //     this.setState({balance : text})
    // })
  }

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  onFormSubmit(e) {
    e.preventDefault();

    this.fetchDeposit(this.fetchBalance());
    this.fetchWithdraw(this.fetchBalance());
  }

  onTransferSubmit(e) {
    e.preventDefault();

    this.fetchTransfer(this.state.accountFrom, this.state.accountTo, this.state.amount);
    this.fetchBalance()
  }

  fetchWithdraw() {
    fetch(`https://smallbank-api.herokuapp.com/withdraw/${this.state.withdraw}`, {
      method: 'post',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
  }

  fetchDeposit() {
    fetch(`https://smallbank-api.herokuapp.com/deposit/${this.state.deposit}`, {
      method: 'post',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
  }

  fetchLogout() {
    fetch("https://smallbank-api.herokuapp.com/logout", {
      method: 'post',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.text())
      .then(text => console.log(text))
  }

  fetchTransfer(accountFrom, accountTo, amount) {
    const bodyData = {
      "accountFrom": accountFrom,
      "accountTo": accountTo,
      "amount": amount
    }

    fetch("https://smallbank-api.herokuapp.com/transfer", {
      method: 'post',
      body:    JSON.stringify(bodyData),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.text())
      .then(text => {
        if (text != "Local transfer completed!") {
          this.setState({ transferCompleted: false })
          return;
        }
        else {
          this.setState({
            transferCompleted: true,
            balance: this.state.balance - amount
          })
        }
      })
  }

  render() {
    return (
      <React.Fragment>
      <Navbar className="justify-content-center" color="primary" fixed="top">
        <NavbarText className="text-white">Welcome, {this.state.firstname} </NavbarText>
        <Nav id="logout">
          <NavItem>
            <Button onClick={this.props.handleLogout} color="primary">Logout</ Button>
          </NavItem>
        </Nav>
      </Navbar>
      <Row className="h-100 w-100">
        <Col className="dashboard-background dashboard--form-padding d-flex align-items-center justify-content-center" sm="6">
          <div>
            <BalanceScreen balance={this.state.balance + " €"}/>

            <Form onSubmit={this.onFormSubmit} className=" w-100">
              <Row form>
                <Col sm={6}>

                  <CustomFormGroup
                  handleChange={this.handleChange}
                  type="number"
                  name="deposit"
                  placeholder="Enter amount..."/>

                  <CustomFormGroup isButton btntext="Deposit"/>

                </Col>
                <Col sm={6}>

                  <CustomFormGroup
                  handleChange={this.handleChange}
                  type="text"
                  name="withdraw"
                  placeholder="Enter amount..."/>

                  <CustomFormGroup isButton btntext="Withdraw"/>

                </Col>
              </Row>
            </Form>
          </div>


        </Col>
        <Col className="d-flex align-items-center" sm="6">
          <Form onSubmit={this.onTransferSubmit} className="w-100">
            <CustomFormGroup
            handleChange={this.handleChange}
            type="text"
            name="accountFrom"
            placeholder="Account from..."/>
            <CustomFormGroup
            handleChange={this.handleChange}
            type="text"
            name="accountTo"
            placeholder="Account to..."/>
            <CustomFormGroup
            handleChange={this.handleChange}
            type="number"
            name="amount"
            placeholder="Amount..."/>
            <CustomFormGroup isButton btntext="Transfer money"/>

            {this.state.transferCompleted ?
            <UncontrolledAlert className="text-center" color="success">
              Transfer was successful
            </UncontrolledAlert>: ""
            }

            {this.state.transferCompleted === false ?
            <UncontrolledAlert className="text-center" color="danger">
              Transfer was unsuccessful
            </UncontrolledAlert>: ""
            }

          </Form>

        </Col>
      </Row>
      </React.Fragment>
    )
  }
}
