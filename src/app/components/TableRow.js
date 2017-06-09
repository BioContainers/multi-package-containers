import React from 'react';

export default class TableRow extends React.Component {
    render() {
        const { id, name, version } = this.props;
        return (
            <tr id={id}>
                <td style={{ width: '60%' }}>{name}</td>
                <td style={{ width: '40%' }}>{version}</td>
                <td style={{ width: 30 }} class="action">
                    <a class="delete" onClick={this.props.onClick.bind(this, id)}>
                        <i class="fa fa-minus" aria-hidden="true"></i>
                    </a>
                </td>
            </tr>
        );
    }
}
