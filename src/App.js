import React from 'react';
// import fs from 'fs';
// import logo from './logo.svg';
import _ from 'lodash';
import shortid from 'shortid';
import firstBy from 'thenby';
import BootstrapTable from 'react-bootstrap-table-next';
import './App.css';

const readServers = () =>
  fetch('https://raw.githubusercontent.com/rapidscrape/best-dedicated-servers/master/output/output.json')
  .then(response => response.json())
  .then(response => {
    const servers = [];

    response.forEach(serverList => {
      serverList.servers.map(server => {
        servers.push({
          ...server,
          provider: serverList.meta.provider,
        });
      });
    });

    return servers;
  });

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
    readServers().then(servers => {
      this.setState({
        servers: servers.map(server => ({
            ...server,
            id: shortid.generate(),
        })),
      });
    });
    // .then(response => {
    //   const availableServers = {
    //     response
    //       .filter(server => server.available)
    //       .map(server => ({
    //         ...server,
    //         id: shortid.generate(),
    //       };
    //   this.setState()
          // .map(server => ({
          //   ...server,
          //   meta: servers[0].meta,
          //   price: server.price[1] !== undefined ? server.price[1] : server.price[0],
          // }))
          // .filter(server => server.price < filterPrice)
          // .map(server => ({
          //   ...server,
          //   storage: _.sortBy(server.storage, storage => storage.type).reverse()[0],
          // }))
          // .sort(
          //   firstBy((a, b) => 0)
          //   .thenBy((a, b) => parseFloat(a.cpu.freq.replace(' Ghz')) > parseFloat(b.cpu.freq.replace(' Ghz')))
          //   .thenBy((a, b) => a.ram.amout > b.ram.amout)
          //   .thenBy((a, b) => a.cpu.cores > b.cpu.cores)
          //   .thenBy((a, b) => a.storage.type === 'SSD' ? -1 : (b.storage.type === 'SSD' ? 1 : 0))
          //   .thenBy((a, b) => (a.storage.size * a.storage.amount * (a.storage.unit === 'TB' ? 1000 : 1)) > (b.storage.size * b.storage.amount * (b.storage.unit === 'TB' ? 1000 : 1)))
          //   .thenBy((a, b) => {
          //     const aBandw = getRealBandwidth(a.bandwidth);
          //     const bBandw = getRealBandwidth(b.bandwidth);
          //     return (aBandw.amount * (aBandw.unit === 'Gbps' ? 1024 : 1)) > (bBandw.amount * (bBandw.unit === 'Gbps' ? 1024 : 1));
          //   })
          //   .thenBy((a, b) => a.ip > b.ip)
          // )
    //   });
    // });
  }

  render() {
    const columns = [
      'provider',
      'cpu',
      'ram',
      'storage',
      'bandwidthSpeed',
      'bandwidthLimit',
      'price',
      // 'ips',
      'location',
    ].map(column => ({
      dataField: column,
      text: column,
    }));

    // const avg = filterPrice / 3;
    const avg = _.mean(this.state.servers.map(server => server.price));

    const rowStyle = (row, rowIndex) => {
      // if(row.price.value && row.price > avg) return null;
      //
      // return { backgroundColor: 'orange' };
    };

    return (
      <div className="App">
        <h1>Best Dedicated Servers</h1>
        <BootstrapTable
          loading={this.state.servers <= 0}
          keyField='id'
          data={this.state.servers.map(server => ({
            id: server.id,
            provider: server.provider,
            cpu: `${server.cpu.amount}x ${server.cpu.frequency} ${server.cpu.name} ${server.cpu.cores} cores`,
            ram: `${server.memory.value} ${server.memory.unit} ${server.memory.type}`,
            storage: server.storage.map(storage => `${storage.amount}x ${storage.value} ${storage.unit} ${storage.type} ${storage.connType}`).join(' & '),
            bandwidthSpeed: `${server.bandwidthSpeed.value} ${server.bandwidthSpeed.unit}`,
            bandwidthLimit: server.bandwidthLimit.value > 0 ? `${server.bandwidthLimit.value} ${server.bandwidthLimit.unit}` : `∞`,
            price: `${server.price.unit}${server.price.value}`,
            // ips: '???',
            location: `${server.location.city}, ${server.location.country}`,
          }))}
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
