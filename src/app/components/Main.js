import React from 'react';
import { inject, observer } from 'mobx-react';
import { Grid, Row, Col } from 'react-bootstrap';
import { CSSTransitionGroup } from 'react-transition-group';

import Packages from './Packages';
import SelectedPackages from './SelectedPackages';


@inject('store') @observer
export default class Main extends React.Component {
    componentDidMount() {
        const el = this.refs.main;
        el.setAttribute('filter-color', 'black');
        $.material.init();
    }

    render() {
        const transitionOptions = {
            component: 'div',
            transitionName: 'slide',
            transitionEnterTimeout: 600,
            transitionLeaveTimeout: 300
        };

        return (
            <div id="main" ref="main" className="full-page">
                <div className="content">
                    <Grid>
                        <Row>
                            <Col md={6} mdOffset={3} className="text-center">
                                <h2 className="title">Multi-requirement containers</h2>
                                <h5 className="description">
                                    Combine several conda packages into one Docker container.
                                </h5>
                            </Col>
                        </Row>
                        <Row bsClass="row cards">
                            <Packages/>
                            <CSSTransitionGroup {...transitionOptions}>
                                {this.props.store.showCard && <SelectedPackages/>}
                            </CSSTransitionGroup>
                        </Row>
                    </Grid>
                </div>
                <div className="full-page-background" style={{ backgroundImage: 'url(src/img/cover.jpg)' }}></div>
            </div>
        );
    }
}
