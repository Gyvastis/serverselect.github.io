import React from 'react';
import shortid from 'shortid';
import firstBy from 'thenby';
import BootstrapTable from 'react-bootstrap-table-next';
import lunr from 'lunr';
import md5 from 'md5';
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

const fetchCpuBenchmarks = () =>
    fetch("https://raw.githubusercontent.com/ServerSelect/node-cpu-benchmark-scraper/main/output/output.json")
        .then(response => response.json())
        .then(({ benchmarks }) => benchmarks);

function arrayAverage(arr){
    var sum = 0;
    for(var i in arr) {
        sum += arr[i];
    }
    var numbersCnt = arr.length;
    return (sum / numbersCnt);
}
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currencies: {
                USD: 1.18,
            },
            currency: 'EUR',
            servers: [],
            cpuBenchmarks: []
        };
    }

    componentDidMount() {
        // fetchCurrencies().then(currencies => {
        //     this.setState({
        //         ...this.state,
        //         currencies,
        //     });
        // });

        Promise.all([
            fetchServers().then(servers => {
                this.setState({
                    ...this.state,
                    servers: servers.map(server => {
                        let price = server.price;

                        if(price.unit !== 'EUR') {
                            price = {
                                value: Math.round(server.price.value / this.state.currencies[server.price.unit] * 10) / 10,
                                unit: 'EUR'
                            };
                        }
                        
                        return {
                            ...server,
                            price,
                            id: shortid.generate(),
                        }
                    })
                });
            }),
            fetchCpuBenchmarks().then(cpuBenchmarks => {
                this.setState({
                    ...this.state,
                    cpuBenchmarks,
                });
            })
        ]).then(() => {
            const cpuBenchmarks = this.state.cpuBenchmarks;
            var idx = lunr(function () {
                this.field('cpu')

                cpuBenchmarks.forEach(function (doc, i) {
                    this.add({
                        ...doc,
                        id: i.toString()
                    })
                }, this);
            });

            const getMatchingCpuBenchmark = cpuName => {
                const result = idx.search(cpuName);
    
                if(result.length > 0) {
                    return cpuBenchmarks[parseInt(result[0].ref)].score;
                }
                else {
                    return -1;
                }
            };

            const servers = this.state.servers;
            this.setState({
                ...this.state,
                servers: servers.map(server => ({
                    ...server,
                    cpuScore: getMatchingCpuBenchmark(server.cpu.name),
                    id: shortid.generate(),
                }))
            });
        }).then(() => {
            const getServerId = server => {
                let id = `${Math.round(server.cpuScore / 100) * 100}`;
                id += `_${server.memory.value}-${server.memory.unit}`;
                id += `_${server.storage[0].amount}x-${server.storage[0].value}-${server.storage[0].unit}-${server.storage[0].type}`;
                id += `_${server.bandwidthSpeed.value}-${server.bandwidthSpeed.unit}`;
                id += `_${server.bandwidthLimit.value}-${server.bandwidthLimit.unit}`;
                return md5(id);
            }
            let groupedPrices = {};
            this.state.servers.map(server => {
                const id = getServerId(server);

                if(!groupedPrices[id]) {
                    groupedPrices[id] = [];
                }

                groupedPrices[id].push(server.price.value);
            });

            let predictedPrices = {};
            Object.keys(groupedPrices).map(id => {
                predictedPrices[id] = arrayAverage(groupedPrices[id]);
            });

            this.setState({
                ...this.state,
                servers: this.state.servers.map(server => ({
                    ...server,
                    predictedPrice: predictedPrices[getServerId(server)]
                }))
            });
        });
    }

    render() {
        const columns = [
            'provider',
            'cpu',
            'cpuScore',
            'ram',
            'storage',
            'bandwidthSpeed',
            'bandwidthLimit',
            'price',
            'predictedPrice',
            'location',
            'url',
        ].map(column => ({
            dataField: column,
            text: column,
            formatter: column === 'url' ? data => <a target="_blank" rel="noopener noreferrer" href={ data }>view</a> : null
        }));

        const servers = this.state.servers.sort(
            firstBy(v => v.price.value)
            .thenBy((a, b) => a.cpuScore < b.cpuScore)
            .thenBy((a, b) => a.memory.amout < b.memory.amout)
        );

        const rowStyle = (row, rowIndex) => {
            return parseFloat(row.predictedPrice) > 0 && parseFloat(row.predictedPrice) < parseFloat(row.price) ? { backgroundColor: 'orange' } : {};
        };

        return (
            <div className="App">
                <h1>Best Dedicated Servers</h1>
                <div>{this.state.currency}. Sorted by price + cpuScore + memory</div>
                <BootstrapTable
                    loading={this.state.servers <= 0}
                    keyField='id'
                    data={servers.map(server => ({
                        id: server.id,
                        provider: server.provider,
                        cpu: `${server.cpu.amount}x ${server.cpu.frequency} ${server.cpu.name} ${server.cpu.cores} cores`,
                        cpuScore: server.cpuScore,
                        ram: `${server.memory.value} ${server.memory.unit} ${server.memory.type}`,
                        storage: server.storage.map(storage => `${storage.amount}x ${storage.value} ${storage.unit} ${storage.type} ${storage.connType}`).join(' or '),
                        bandwidthSpeed: `${server.bandwidthSpeed.value} ${server.bandwidthSpeed.unit}`,
                        bandwidthLimit: server.bandwidthLimit.value > 0 ? `${server.bandwidthLimit.value} ${server.bandwidthLimit.unit}` : `∞`,
                        price: `${server.price.value.toFixed(2)}`,
                        predictedPrice: `${server.predictedPrice > 0 && server.predictedPrice != server.price.value ? server.predictedPrice.toFixed(2) : '-'}`,
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
