import React from 'react';
import shortid from 'shortid';
import firstBy from 'thenby';
import BootstrapTable from 'react-bootstrap-table-next';
import './App.css';

const fetchServers = () =>
    fetch('https://raw.githubusercontent.com/serverselect/node-server-scraper/master/output/output.json')
        .then(response => response.json())
        .then(response => {
            const servers = [];

            response.forEach(serverList => {
                serverList.servers.filter(server => server.available).forEach(server => {
                    servers.push({
                        ...server,
                        provider: serverList.meta.provider,
                    });
                });
            });

            return servers;
        });

const fetchCurrencies = () =>
    fetch("http://data.fixer.io/api/latest?access_key=553a7ee7b07bf316af731f3c0bf251f7")
        .then(response => response.json())
        .then(({ rates }) => rates);

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currencies: {
                USD: 1.1,
            },
            currency: 'EUR',
            servers: [],
        };
    }

    componentDidMount() {
        this.setServers();
    }

    setServers() {
        fetchCurrencies().then(currencies => {
            this.setState({
                ...this.state,
                currencies,
            });
        })
        fetchServers()
            .then(servers => {
                this.setState({
                    ...this.state,
                    servers: servers.map(server => ({
                        ...server,
                        id: shortid.generate(),
                    }))
                });
          });
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
            'location',
            'url',
        ].map(column => ({
            dataField: column,
            text: column,
            formatter: column === 'url' ? data => <a target="_blank" rel="noopener noreferrer" href={ data }>view</a> : null
        }));

        const servers = this.state.servers.map(server => {
            if(server.price.unit !== 'EUR') {
                return {
                    ...server,
                    price: {
                        value: server.price.value / this.state.currencies[server.price.unit],
                        unit: 'EUR'
                    }
                };
            }

            return server;
        }).sort(firstBy(v => v.price.value)
        // .thenBy((a, b) => parseFloat(a.cpu.frequency.replace(' Ghz')) > parseFloat(b.cpu.frequency.replace(' Ghz')))
        // .thenBy((a, b) => a.memory.amout > b.memory.amout)
        // .thenBy((a, b) => a.cpu.cores > b.cpu.cores)
        // .thenBy((a, b) => a.storage.type === 'SSD' ? -1 : (b.storage.type === 'SSD' ? 1 : 0))
        // .thenBy((a, b) => (a.storage.size * a.storage.amount * (a.storage.unit === 'TB' ? 1000 : 1)) > (b.storage.size * b.storage.amount * (b.storage.unit === 'TB' ? 1000 : 1)))
        // .thenBy((a, b) => (a.bandwidthSpeed.value * (a.bandwidthSpeed.unit === 'Gbps' ? 1024 : 1)) > (b.bandwidthSpeed.value * (b.bandwidthSpeed.value.unit === 'Gbps' ? 1024 : 1)))
        // .thenBy((a, b) => a.ip > b.ip)
        );

        // const filterPrice = 100;
        // const avg = filterPrice / 3;

        // const avg = _.mean(servers.map(server => server.price.value));
        // console.log(avg)

        const rowStyle = (row, rowIndex) => {
            // if (parseFloat(row.price) > avg) return {};
            //
            // return { backgroundColor: 'cyan' };
        };

        return (
            <div className="App">
                <h1>Best Dedicated Servers</h1>
                <div>{this.state.currency}</div>
                <BootstrapTable
                    loading={this.state.servers <= 0}
                    keyField='id'
                    data={servers.map(server => ({
                        id: server.id,
                        provider: server.provider,
                        cpu: `${server.cpu.amount}x ${server.cpu.frequency} ${server.cpu.name} ${server.cpu.cores} cores`,
                        ram: `${server.memory.value} ${server.memory.unit} ${server.memory.type}`,
                        storage: server.storage.map(storage => `${storage.amount}x ${storage.value} ${storage.unit} ${storage.type} ${storage.connType}`).join(' or '),
                        bandwidthSpeed: `${server.bandwidthSpeed.value} ${server.bandwidthSpeed.unit}`,
                        bandwidthLimit: server.bandwidthLimit.value > 0 ? `${server.bandwidthLimit.value} ${server.bandwidthLimit.unit}` : `∞`,
                        price: `${server.price.value.toFixed(2)}`,
                        location: `${server.location.city}, ${server.location.country}`,
                        url: server.url,
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
