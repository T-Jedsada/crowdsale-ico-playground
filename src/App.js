import React, { Component } from 'react';
import { Form, Icon, Input, Button, message } from 'antd';
import './App.css';
import token from './maxToken';
import moment from 'moment';
import { FlipClock } from 'reactflipclock-js';

import { createStore } from 'redux';
import CounterLink from './containers/CounterLink';
import counter from './reducers';
import { Provider } from 'react-redux';

const store = createStore(counter);
const { web3 } = window;
const FormItem = Form.Item;
const unitMaxTokenPerEth = 10;
const contract = web3.eth.contract(token.abi);
const maxToken = contract.at(token.address);

class App extends Component {
  state = {
    title: '',
    myAddress: '',
    clickAble: false,
    isLoading: false,
    amount: '',
    totalEther: 0,
    timestamp: ''
  };

  formatDateCounter(mills) {
    return moment(mills).format('DD/MM/YYYY HH:mm:ss');
  }

  componentDidMount() {
    web3.eth.getAccounts((err, response) => {
      if (!err) {
        this.setState({ myAddress: response[0] });
      }
    });
    maxToken.startSale((err, response) => {
      if (!err) {
        const mills = response.c[0] * 1000;
        const diff =
          (Date.parse(new Date(mills)) - Date.parse(new Date())) / 1000;
        if (diff > 0) {
          this.setState({
            timestamp: this.calculateCountdown(moment(mills).format()),
            title: 'Offer Start 🎉'
          });
        } else {
          maxToken.deadline((err, response) => {
            if (!err) {
              this.setState({
                timestamp: this.calculateCountdown(
                  moment(response.c[0] * 1000).format()
                ),
                title: 'Offer End 🎊'
              });
            }
          });
        }
      }
    });
  }

  onAmountChange = event => {
    const amount = event.target.value;
    const totalEther = amount / unitMaxTokenPerEth;
    this.setState({ amount, totalEther, clickAble: amount > 0 });
  };

  onSubmitForm = event => {
    event.preventDefault();
    this.setState({ isLoading: true });
    maxToken.buy(
      {
        form: this.state.myAddress,
        value: web3.toWei(this.state.totalEther, 'ether')
      },
      err => {
        this.setState({ isLoading: false });
        if (!err) {
          message.success('Transaction successfully', 2);
          this.setState({ amount: '', totalEther: 0, clickAble: false });
        } else {
          message.error('Transaction failed', 2);
        }
      }
    );
  };

  calculateCountdown(endDate) {
    return (Date.parse(new Date(endDate)) - Date.parse(new Date())) / 1000;
  }

  render() {
    return (
      <Provider store={store}>
        <div className="App">
          <h1>{this.state.title}</h1>
          {this.state.timestamp > 0 ? (
            <div style={{ marginTop: '10px', marginBottom: '16px' }}>
              <FlipClock
                countDownTime={this.state.timestamp}
                clockFace="DailyCounter"
              />
            </div>
          ) : (
            <h2>Loading...</h2>
          )}
          <h2>
            Exchange (1 ETH == {unitMaxTokenPerEth} {token.symbol})
          </h2>
          <Form
            style={{ width: '30%', height: 'auto' }}
            onSubmit={this.onSubmitForm}
          >
            <FormItem>
              <Input
                prefix={
                  <Icon type="dollar" style={{ color: 'rgba(0,0,0,.25)' }} />
                }
                type="number"
                placeholder="Amount"
                value={this.state.amount}
                onChange={this.onAmountChange}
              />
            </FormItem>
            <FormItem>
              <Input
                addonAfter="ETH"
                disabled="true"
                value={this.state.totalEther}
              />
            </FormItem>
            <FormItem>
              <Button
                disabled={!this.state.clickAble}
                loading={this.state.isLoading}
                icon="buy"
                style={{ width: '50%' }}
                type="primary"
                htmlType="submit"
              >
                Buy
              </Button>
            </FormItem>
          </Form>
          <CounterLink />
        </div>
      </Provider>
    );
  }
}

export default App;
