import React from 'react';
import { html } from 'components';
import OutsideAlerter from 'ui/global/OutsideAlerter';
import mainLogo from 'static/images/logo.svg';
import arrowDown from 'static/images/landing/arrow-down.svg';
import burgerIcon from 'static/images/landing/burger.svg';
import crossIcon from 'static/images/landing/cross-icon.svg';

import './style.scss';

const bem = html.bem('LandingHeader');

interface Props {}
interface State {
    isProductsListVisible: boolean;
    isLearnListVisible: boolean;
    isMobileMenuVisible: boolean;
}
interface Link {
    label: string;
    onClick?: () => void;
    icon?: string;
    url?: string;
}

class LandingHeader extends React.Component<Props, State> {
    productLinks!: Link[];
    learnLinks!: Link[];
    links!: Link[];

    constructor(props) {
        super(props);

        this.mapLink = this.mapLink.bind(this);
        this.outsideHandler = this.outsideHandler.bind(this);
        this.triggerLearnList = this.triggerLearnList.bind(this);
        this.triggerProductsList = this.triggerProductsList.bind(this);
        this.hideMobileMenu = this.hideMobileMenu.bind(this);
        this.openMobileMenu = this.openMobileMenu.bind(this);

        this.productLinks = [
            {
                label: 'Neutrino dashboard',
            },
            {
                label: 'Bonds dashboard',
            },
            {
                label: 'Staking dashboard',
            },
        ];
        this.learnLinks = [
            {
                label: 'White paper',
                url: 'https://drive.google.com/file/d/1QcA8msCWPTbAVGg5_VGGGttm11WHghwX/view'
            },
            {
                label: 'Q&A',
            },
            {
                label: 'Blog',
            },
        ];
        this.links = [
            {
                label: 'Products',
                onClick: this.triggerProductsList,
                icon: arrowDown,
            },
            {
                label: 'Learn',
                onClick: this.triggerLearnList,
                icon: arrowDown,
            },
            {
                label: 'Login',
            },
        ];

        this.state = {
            isProductsListVisible: false,
            isLearnListVisible: false,
            isMobileMenuVisible: false,
        };
    }

    hideMobileMenu() {
        this.setState({ isMobileMenuVisible: false });
    }

    openMobileMenu() {
        this.setState({ isMobileMenuVisible: true });
    }

    triggerLearnList() {
        this.setState(prevState => ({
            isProductsListVisible: false,
            isLearnListVisible: !prevState.isLearnListVisible,
        }));
    }

    triggerProductsList() {
        this.setState(prevState => ({
            isLearnListVisible: false,
            isProductsListVisible: !prevState.isProductsListVisible,
        }));
    }

    mapLink({ onClick = () => {}, label, icon, url }: Link) {
        const { isProductsListVisible, isLearnListVisible } = this.state;
        const isChecked =
            (label === 'Products' && isProductsListVisible) ||
            (label === 'Learn' && isLearnListVisible)
                ? 'opened'
                : '';

        return (
            <li>
                <a href={url || '#'} onClick={onClick} className={bem.element('h-link', isChecked)}>
                    <span>{label}</span>
                    {icon && <img src={icon} alt="" />}
                </a>
            </li>
        );
    }

    outsideHandler() {
        this.setState({
            isProductsListVisible: false,
            isLearnListVisible: false,
        });
    }

    render() {
        const links = this.links.map(this.mapLink);
        const productLinks = this.productLinks.map(this.mapLink);
        const learnLinks = this.learnLinks.map(this.mapLink);
        const { isProductsListVisible, isLearnListVisible, isMobileMenuVisible } = this.state;

        return (
            <div className={bem.element('main')}>
                <div className={bem.element('burger')} onClick={this.openMobileMenu}>
                    <img src={burgerIcon} />
                </div>
                <div className={bem.element('logo')}>
                    <img src={mainLogo} alt="neutrino" />
                    <span>beta</span>
                </div>
                {isMobileMenuVisible && (
                    <div className={bem.element('mobile-menu')}>
                        <div>
                            <img src={crossIcon} alt="" onClick={this.hideMobileMenu} />
                        </div>
                        <ul>
                            {links[links.length - 1]}
                            {productLinks}
                            {learnLinks}
                        </ul>
                    </div>
                )}
                <OutsideAlerter handler={this.outsideHandler} className={bem.element('actions')}>
                    {isProductsListVisible && (
                        <div className={bem.element('sub-dp', 'products')}>
                            <ul>{productLinks}</ul>
                        </div>
                    )}
                    {isLearnListVisible && (
                        <div className={bem.element('sub-dp', 'learn')}>
                            <ul>{learnLinks}</ul>
                        </div>
                    )}
                    <ul className={bem.element('links')}>{links}</ul>
                </OutsideAlerter>
            </div>
        );
    }
}

export default LandingHeader;
