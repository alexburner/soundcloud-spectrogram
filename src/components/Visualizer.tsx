import * as React from 'react';

import * as draw from 'src/singletons/draw';
import {getChannels} from 'src/singletons/audio';
import {getScale} from 'src/singletons/fullscreen';
import {togglePlay} from 'src/singletons/playlist';

import Fullscreen from 'src/components/Fullscreen';

interface Props {
    width:number,
    height:number,
    borderX:number,
    borderY:number,
}

interface State {
    isFullscreen:boolean;
    canvasScale:number;
}

export default class Visualizer extends React.Component<Props, State> {
    private onFullscreenChange:{(is:boolean):void};
    private container:HTMLElement;
    private canvas:HTMLCanvasElement;
    private canvasCtx:CanvasRenderingContext2D;
    private mountSignature:{}; // object reference as id
    private containerWidth:number;
    private containerHeight:number;
    private upperHeight:number;
    private lowerHeight:number;

    constructor(props) {
        super(props);
        this.upperHeight = 1 * (props.height / 6);
        this.lowerHeight = 5 * (props.height / 6);
        this.containerWidth = props.width + props.borderX * 2;
        this.containerHeight = props.height + props.borderY * 2;
        this.state = {isFullscreen: false, canvasScale: 1};
        this.onFullscreenChange = (isFullscreen:boolean) => {
            this.setState({
                isFullscreen,
                canvasScale: isFullscreen
                    ? getScale(this.canvas, 0.92)
                    : 1
            });
        };
    }

    render() {
        let containerWidth;
        let containerHeight;
        if (this.state.isFullscreen) {
            containerWidth = '100%';
            containerHeight = '100%';
        } else {
            containerWidth = `${this.containerWidth}px`;
            containerHeight = `${this.containerHeight}px`;
        }
        return (
            <div
                ref={(el) => this.container = el}
                className="visualizer"
                onClick={togglePlay}
                style={{
                    width: containerWidth,
                    height: containerHeight,
                    borderWidth: `
                        ${this.props.borderY}px
                        ${this.props.borderX}px
                    `,
                }}
            >
                <canvas
                    ref={el => this.canvas = el}
                    style={{transform: `
                        perspective(1px)
                        translateY(-50%)
                        scale(${this.state.canvasScale})
                    `}}
                    height={this.props.height}
                    width={this.props.width}
                />
                {this.container &&
                    <Fullscreen
                        onChange={this.onFullscreenChange}
                        target={this.container}
                    />
                }
            </div>
        );
    }

    componentDidMount() {
        this.forceUpdate(); // render() with ref for Fullscreen
        this.mountSignature = {}; // unique object reference
        this.canvasCtx = this.canvas.getContext('2d');
        this.animate(this.mountSignature);
    }

    componentWillUnmount() {
        this.mountSignature = null; // stops animation loop
    }

    animate(mountSignature:{}) {
        // bail if closure & class signature don't match
        if (mountSignature !== this.mountSignature) return;
        const channels = getChannels();
        draw.spectrogram({
            x: 0,
            y: 0,
            width: this.props.width,
            height: this.upperHeight,
            context: this.canvasCtx,
            channels,
        });
        draw.waterfall({
            x: 0,
            y: this.upperHeight,
            width: this.props.width,
            height: this.lowerHeight,
            context: this.canvasCtx,
            channels,
        });
        window.requestAnimationFrame(() => {
            this.animate(mountSignature);
        });
    }
}