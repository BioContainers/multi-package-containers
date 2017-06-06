import { observable } from 'mobx';
import { sortBy } from 'lodash';


class PackageModel {
    @observable id = Date.now()  // pseudo-id
    @observable name
    @observable version

    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
}

class SelectedPackagesStore {
    @observable showCard = false
    @observable packages = []

    add(name, version) {
        this.packages.push(new PackageModel(name, version));
        this.packages = sortBy(this.packages, 'name');
    }

    remove(id) {
        const record = this.find('id', id);
        if (record) {
            this.packages = this.packages.filter((item) => item.id !== record.id);
        }
    }

    removeAll() {
        this.packages = [];
    }

    find(prop, value) {
        return this.packages.find((item) => item.hasOwnProperty(prop) ? item[prop] === value : false);
    }
}

export default new SelectedPackagesStore();
