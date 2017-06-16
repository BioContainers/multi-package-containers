import React from 'react';
import { observe } from 'mobx';
import { inject, observer } from 'mobx-react';
import { createHash } from 'crypto';

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
        const { tsvOutput, containerName } = this.refs;
        const packagesCard = document.querySelector('#packages-card');

        if (packages.length !== 0) {
            const output = this.getContent();
            const name = this.getContainerName();
            tsvOutput.innerText = output;
            containerName.innerText = name;
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

    getContainerName() {
        const { store } = this.props;
        let text = '';

        if (store.packages.length === 1) {
            const target = store.packages[0];
            text = `${target.name}:${target.version}`;
        } else {
            const packageNames = store.packages.map((item) => item.name);
            const packageNamesString = packageNames.join('\n');
            let packageHash = createHash('sha1');
            packageHash.update(packageNamesString);
            packageHash = packageHash.digest('hex');

            const packageVersions = store.packages.map((item) => item.version || 'null');
            let versionHash;

            if (packageVersions.length > 0) {
                const packageVerisonsString = packageVersions.join('\n');
                versionHash = createHash('sha1');
                versionHash.update(packageVerisonsString);
                versionHash = versionHash.digest('hex');
            } else {
                versionHash = '';
            }

            text = `quay.io/biocontainers/mulled-v2-${packageHash}:${versionHash}`;
        }

        return text;
    }

    clearList() {
        this.props.store.removeAll();
    }

    handleClick(id) {
        this.props.store.remove(id);
    }

    download() {
        const content = this.refs.tsvOutput.innerText;
        const filename = this.refs.containerName.innerText + '.tsv';
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
                key={item.id}
                id={item.id}
                name={item.name}
                version={item.version}
                onClick={() => this.handleClick(item.id)}
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
                            <button
                                id="clear-all"
                                className="btn btn-success btn-xs"
                                onClick={() => this.clearList()}
                            >Clear</button>
                        </div>
                        <div id="result">
                            <hr/>
                            <p>
                                To create a container, please add the following string to <a href="https://github.com/BioContainers/multi-package-containers/blob/master/combinations/hash.tsv" target="_blank">this file</a> as a pull request:</p>
                            <pre ref="tsvOutput"></pre>
                            <p>Container name:</p>
                            <pre ref="containerName"></pre>
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
