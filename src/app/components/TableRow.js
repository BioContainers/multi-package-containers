import React from 'react';


function TableRow(props) {
    return (
        <tr id={props.id}>
            <td style={{ width: '60%' }}>{props.name}</td>
            <td style={{ width: '40%' }}>{props.version}</td>
            <td style={{ width: 30 }} class="action">
                <a href="#" class="delete" onClick={props.onClick}></a>
            </td>
        </tr>
    );
}

export default TableRow;
