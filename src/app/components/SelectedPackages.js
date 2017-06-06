import React from 'react';
import { observe } from 'mobx';
import { inject, observer } from 'mobx-react';
import sha1 from 'sha1';

import TableRow from './TableRow';


@inject('store') @observer
export default class SelectedPackages extends React.Component {
    componentWillMount() {
        // Listen to store events
        this.disposer = observe(this.props.store, (change) => {
            if (change.type === 'update' && change.name === 'packages') {
                this.update(change.newValue);
            }
        });
    }

    componentDidMount() {
        // Manually trigger the update because the component was created by
        // adding a package into the store *before* the disposer initialization
        this.update(this.props.store.packages);

        this.refs.downloadButton.addEventListener('click', this.download.bind(this));
    }

    componentWillUnmount() {
        // Ignore any future updates
        this.disposer();
    }

    update(packages) {
        const { tsvOutput, imageName } = this.refs;
        const packagesCard = document.querySelector('#packages-card');

        if (packages.length !== 0) {
            const output = this.getContent();
            const name = this.getImageName();
            tsvOutput.innerText = output;
            imageName.innerText = name;
        } else {
            packagesCard.className = 'col-md-8 col-md-offset-2';
            this.props.store.showCard = false;
        }
    }

    getContent() {
        return this.props.store.packages.map((item) => {
            return item.name + '=' + item.version;
        }).join();
    }

    getImageName() {
        const { store } = this.props;
        let text = '';

        if (store.packages.length === 1) {
            const target = store.packages[0];
            const suffix = ':' + target.version;
            text = target.name + suffix;
        } else {
            const prefix = 'quay.io/biocontainers/mulled-v1-';
            const packages = store.packages.map((item) => {
                return item.name + '=' + item.version;
            });
            const packagesString = packages.join('\n');
            const hash = sha1(packagesString);
            text = prefix + hash;
        }

        return text;
    }

    clearList() {
        this.props.store.removeAll();
    }

    removePackage(id) {
        this.props.store.remove(id);
    }

    download() {
        const content = this.refs.tsvOutput.innerText + '\t \t ';
        const filename = this.refs.imageName.innerText + '.tsv';
        const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);

        const elem = document.createElement('a');
        elem.setAttribute('href', url);
        elem.setAttribute('download', filename);
        document.body.appendChild(elem);
        elem.click();
        elem.remove();
    }

    render() {
        const Rows = this.props.store.packages.map((item) => {
            return <TableRow
                key={item.id} id={item.id} name={item.name}
                version={item.version}
                onClick={this.removePackage.bind(this)}
            />;
        });

        return (
            <div ref="card" id="selected-packages-card" className="col-md-6">
                <div className="card">
                    <div className="card-header card-header-text" data-background-color="green">
                        <h4 className="card-title">Selected Packages</h4>
                    </div>
                    <div className="card-content">
                        <table id="selected-packages" className="table">
                            <tbody>{Rows}</tbody>
                        </table>
                        <div className="text-center">
                            <button onClick={this.clearList.bind(this)}
                                id="clear-all" className="btn btn-success btn-xs">Clear
                            </button>
                        </div>
                        <div id="result">
                            <hr/>
                            <p>Output:</p>
                            <pre ref="tsvOutput"></pre>
                            <p>Image name:</p>
                            <pre ref="imageName"></pre>
                            <div className="text-center">
                                <button ref="downloadButton" className="btn btn-sm btn-primary btn-success">
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
