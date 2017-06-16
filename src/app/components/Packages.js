import React from 'react';
import { inject } from 'mobx-react';
import axios from 'axios';
import { each, union } from 'lodash';


@inject('store')
export default class Packages extends React.Component {
    componentDidMount() {
        this.initializeDataTables();

        const domain = document.location.origin + document.location.pathname;

        function getAnacondaPackages() {
            // return axios.get('https://conda.anaconda.org/anaconda/linux-64/repodata.json');
            return axios.get(domain + '/repodata/anaconda/repodata.json');
        }

        function getBiocondaPackages() {
            // return axios.get('https://conda.anaconda.org/bioconda/linux-64/repodata.json);
            return axios.get(domain + '/repodata/bioconda/repodata.json');
        }

        function getCondaforgePackages() {
            // return axios.get('https://conda.anaconda.org/conda-forge/linux-64/repodata.json');
            return axios.get(domain + '/repodata/conda-forge/repodata.json');
        }

        // Set a timeout to render the whole page before fetching the data
        setTimeout(() => {
            axios.all([getAnacondaPackages(), getBiocondaPackages(), getCondaforgePackages()])
                .then(axios.spread((anacondaResponse, biocondaResponse, condaforgeResponse) => {
                    const anaconda = this.processData(anacondaResponse.data, 'anaconda');
                    const bioconda = this.processData(biocondaResponse.data, 'bioconda');
                    const condaforge = this.processData(condaforgeResponse.data, 'conda-forge');
                    const packages = union(anaconda, bioconda, condaforge);
                    this.table.rows.add(packages).draw();
                }));
        }, 750);
    }

    initializeDataTables() {
        this.table = $('#datatables')
            .DataTable({  // eslint-disable-line
                pagingType: 'full',
                lengthChange: false,
                pageLength: 10,
                language: {
                    search: '_INPUT_',
                    searchPlaceholder: 'Search packages',
                    emptyTable: '<div id="loader"></div>'
                },
                columns: [
                    {
                        title: 'Name',
                        data: 'name',
                        // orderable: false,
                        width: '40%'
                    },
                    {
                        title: 'Version',
                        data: 'version',
                        orderable: false,
                        width: '30%'
                    },
                    {
                        title: 'Channel',
                        data: 'channel',
                        orderable: false,
                        width: '30%'
                    },
                    {
                        searhable: false,
                        orderable: false,
                        width: '30px'
                    }
                ],
                columnDefs: [
                    {
                        targets: 0,
                        orderData: [0, 1]
                    },
                    {
                        targets: 3,
                        className: 'action',
                        data: () => '<a class="add" href="#"></a>'
                    }
                ]
            });

        // Make table's header orange
        this.table.table().header().classList.add('text-warning');

        // Add search icon
        const tableFilter = document.querySelector('#datatables_filter');
        const searchIcon = document.createElement('i');
        searchIcon.className = 'fa fa-search';
        searchIcon.setAttribute('aria-hidden', true);
        tableFilter.insertBefore(searchIcon, tableFilter.firstChild);

        // Make search input orange on focus
        const search = document.querySelector('#datatables_filter label');
        search.classList.add('form-warning');

        this.table.on('click', '.add', this.addPackage.bind(this));
        document.querySelector('.material-datatables label').classList.add('form-group');
    }

    processData(data, channel) {
        let packages = [];
        let index = {};

        each(data.packages, (obj) => {
            const name = obj.name;
            const version = obj.version;
            const packageObject = {
                name: name,
                version: version,
                channel: channel
            };

            if (Object.keys(index).indexOf(name) === -1) {
                index[name] = version;
                packages.push(packageObject);
            } else {
                const idx = packages.findIndex((item) => {
                    return item.name === name;
                });

                // Always keep the freshest package
                if (packages[idx].version < version) {
                    index[name] = version;
                    packages[idx] = packageObject;
                }
            }
        });

        return packages;
    }

    addPackage(e) {
        e.preventDefault();

        const tr = e.target.closest('tr');
        const record = this.table.row(tr).data();
        const { store } = this.props;
        const foundPackage = store.find('name', record.name);
        const packagesCard = document.querySelector('#packages-card');

        if (!foundPackage) {
            store.add(record.name, record.version);
            if (store.packages.length === 1) {
                packagesCard.className = 'col-md-6';
                store.showCard = true;
            }
        } else {
            const el = document.querySelector(`tr[id="${foundPackage.id}"]`);
            $(el).animateCss('shake');
        }
    }

    render() {
        return (
            <div id="packages-card" class="col-md-8 col-md-offset-2">
                <div className="card">
                    <div className="card-header card-header-text" data-background-color="orange">
                        <h4 className="card-title">Packages</h4>
                    </div>
                    <div className="card-content">
                        <div className="material-datatables">
                            <table id="datatables" cellSpacing="0" style={{ width: '100%' }}
                                className="table table-no-bordered table-hover table-responsive">
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
