import React from 'react';
// import fs from 'fs';
// import logo from './logo.svg';
import _ from 'lodash';
import firstBy from 'thenby';
import BootstrapTable from 'react-bootstrap-table-next';
import './App.css';

const readServers = () =>
  fetch('http://localhost:3000/output.json')
  .then(response => response.json());

const getRealBandwidth = bandwidthString => {
  const bandwidth = bandwidthString.split(' ');

  return {
    amount: bandwidth[0],
    unit: bandwidth[1],
  };
};

const filterPrice = 100;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      servers: [],
    };
  }

  componentDidMount() {
    this.setServers();
  }

  setServers() {
    readServers()
    .then(servers => {
      this.setState({
        ...this.state,
        servers: servers[0].servers
          .filter(server => server.available)
          .map(server => ({
            ...server,
            meta: servers[0].meta,
            price: server.price[1] !== undefined ? server.price[1] : server.price[0],
          }))
          .filter(server => server.price < filterPrice)
          .map(server => ({
            ...server,
            storage: _.sortBy(server.storage, storage => storage.type).reverse()[0],
          }))
          .sort(
            firstBy((a, b) => 0)
            .thenBy((a, b) => a.storage.type === 'SSD' ? -1 : (b.storage.type === 'SSD' ? 1 : 0))
            .thenBy((a, b) => parseFloat(a.cpu.freq.replace(' Ghz')) > parseFloat(b.cpu.freq.replace(' Ghz')))
            .thenBy((a, b) => a.ram.amout > b.ram.amout)
            .thenBy((a, b) => a.cpu.cores > b.cpu.cores)
            .thenBy((a, b) => {
              const aBandw = getRealBandwidth(a.bandwidth);
              const bBandw = getRealBandwidth(b.bandwidth);
              return (aBandw.amount * (aBandw.unit === 'Gbps' ? 1024 : 1)) > (bBandw.amount * (bBandw.unit === 'Gbps' ? 1024 : 1));
            })
            .thenBy((a, b) => (a.storage.size * a.storage.amount * (a.storage.unit === 'TB' ? 1000 : 1)) > (b.storage.size * b.storage.amount * (b.storage.unit === 'TB' ? 1000 : 1)))
            .thenBy((a, b) => a.ip > b.ip)
          )
      });
    });
  }

  render() {
    const columns = [
      'id',
      'provider',
      'cpu',
      'ram',
      'storage',
      'bandwidth',
      'price',
      'ips',
      'location',
    ].map(column => ({
      dataField: column,
      text: column,
    }));

    const data = this.state.servers.map((server, key) => ({
      id: key + 1,
      provider: server.meta.provider,
      cpu: `${server.cpu.cores}x ${server.cpu.freq} ${server.cpu.name}`,
      ram: `${server.ram.amout} ${server.ram.unit} ${server.ram.version}`,
      storage: `${server.storage.amount}x ${server.storage.size} ${server.storage.unit} ${server.storage.type} ${server.storage.conn_type}`,
      bandwidth: server.bandwidth,
      price: `€${server.price}`,
      ips: server.ip,
      location: `${server.location.country}, ${server.location.city}`
    }));

    const avg = filterPrice / 3;
    // const avg = _.mean(this.state.servers.map(server => server.price));

    const rowStyle = (row, rowIndex) => {
      if(row.price && row.price.replace('€', '') > avg) return {};

      return { backgroundColor: 'orange' };
    };

    return (
      <div className="App">
        <BootstrapTable
          loading={this.state.servers <= 0}
          keyField='id'
          data={data}
          columns={columns}
          bootstrap4={true}
          bordered={true}
          hover={true}
          striped={true}
          condensed={true}
          rowStyle={rowStyle}
        />
      </div>
    );
  }
}

export default App;
