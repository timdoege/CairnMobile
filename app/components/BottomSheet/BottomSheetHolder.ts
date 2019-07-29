import { GestureHandlerStateEvent, GestureHandlerTouchEvent, GestureState, GestureStateEventData, GestureTouchEventData, HandlerType, Manager, PanGestureHandler } from 'nativescript-gesturehandler';
import { View } from 'tns-core-modules/ui/core/view';
import { layout } from 'tns-core-modules/utils/utils';
import { Component, Prop } from 'vue-property-decorator';
import * as Animation from '~/animation';
import BaseVueComponent from '../BaseVueComponent';
import BottomSheet, { NATIVE_GESTURE_TAG } from './BottomSheetBase';

const OPEN_DURATION = 100;
const CLOSE_DURATION = 200;

export const PAN_GESTURE_TAG = 1;

export interface BottomSheetHolderScrollEventData {
    top: number;
    percentage: number;
    height: number;
}

@Component({})
export default class BottomSheetHolder extends BaseVueComponent {
    bottomSheet: BottomSheet;
    setBottomSheet(comp: BottomSheet) {
        this.bottomSheet = comp;
        if (comp) {
            comp.$on('listViewAtTop', value => {
                this.log('listViewAtTop changed', value);
                this.panEnabled = value;
                // if (value && this._isPanning) {
                // if (this.bottomSheet) {
                //     this.bottomSheet.scrollEnabled = !value;
                // }
                // }
            });
        }
    }
    opened = false;
    _isPanning = false;
    set isPanning(value) {
        // console.log('set isPanning', value);
        if (value !== this._isPanning) {
            this._isPanning = value;
            // console.log('set isPanning1', value, this.panEnabled, this._isPanning);
            // if (value && this.panEnabled) {
            this.bottomSheet && (this.bottomSheet.scrollEnabled = !(value && this.panEnabled));
            // }
        }
    }
    get isPanning() {
        // console.log('get isPanning1', this._isPanning);
        return this._isPanning;
    }
    isAnimating = false;
    prevDeltaY = 0;
    viewHeight = 0;
    mCurrentViewHeight = 0;
    set currentViewHeight(value) {
        if (this.bottomSheet) {
            this.bottomSheet.scrollEnabled = this.mCurrentViewHeight === value;
        }
        this.mCurrentViewHeight = value;

        this.$emit('scroll', {
            top: value,
            percentage: (this.viewHeight - value) / this.viewHeight,
            height: this.viewHeight - value
        } as BottomSheetHolderScrollEventData);
    }
    get currentViewHeight() {
        return this.mCurrentViewHeight;
    }
    currentSheetTop = 0;

    @Prop({
        default: () => [50]
    })
    peekerSteps;
    // @Prop()
    // shouldPan: Function;
    @Prop({
        // default: [50]
    })
    scrollViewTag;

    // @Prop({
    //     default: true
    // })
    isPanEnabled: boolean = true;
    // @Watch('panEnabled')
    set panEnabled(value) {
        if (value !== this.isPanEnabled) {
            this.isPanEnabled = value;
            console.log('onPanEnabledChanged', value);
            // this.panGestureHandler.enabled = value;
        }
    }
    get panEnabled() {
        return this.isPanEnabled;
    }

    constructor() {
        super();
    }
    panGestureHandler: PanGestureHandler;
    mounted() {
        super.mounted();
        // this.log('mounted');
        const manager = Manager.getInstance();
        const gestureHandler = manager.createGestureHandler(HandlerType.PAN, PAN_GESTURE_TAG, {
            shouldCancelWhenOutside: false,
            activeOffsetY: 5,
            failOffsetY: -5,
            simultaneousHandlers: gVars.isIOS ? [NATIVE_GESTURE_TAG] : undefined
        });
        gestureHandler.on(GestureHandlerTouchEvent, this.onGestureTouch, this);
        gestureHandler.on(GestureHandlerStateEvent, this.onGestureState, this);
        // this.log('mounted2', !!this.scrollingView, !!gestureHandler);
        gestureHandler.attachToView(this.scrollingView);
        this.panGestureHandler = gestureHandler as any;
    }
    destroyed() {
        if (this.panGestureHandler) {
            this.panGestureHandler.off(GestureHandlerTouchEvent, this.onGestureTouch, this);
            this.panGestureHandler.off(GestureHandlerStateEvent, this.onGestureState, this);
            this.panGestureHandler.detachFromView(this.scrollingView);
            this.panGestureHandler = null;
        }
    }
    get scrollingView() {
        return this.$refs['scrollingView'].nativeView as View;
    }
    get translationMaxOffset() {
        return this.peekerSteps.slice(-1)[0];
    }
    onLayoutChange() {
        this.viewHeight = layout.toDeviceIndependentPixels(this.nativeView.getMeasuredHeight());
        if (this.currentViewHeight === 0) {
            this.currentViewHeight = this.viewHeight;
        }
    }
    onGestureState(args: GestureStateEventData) {
        const { state, prevState, extraData, view } = args.data;

        this.updateIsPanning(state);
        // this.log('onGestureState', state, prevState, GestureState.ACTIVE, this._isPanning, this.panEnabled);
        if (!this.panEnabled) {
            return;
        }
        if (prevState === GestureState.ACTIVE) {
            const { velocityY, translationY } = extraData;
            const viewTop = this.currentViewHeight - this.viewHeight;

            const dragToss = 0.05;
            const endOffsetY = viewTop + translationY - this.prevDeltaY + dragToss * velocityY;

            const steps = [0].concat(this.peekerSteps);
            let destSnapPoint = steps[0];
            // console.log('onPan', 'done', viewTop, translationY, this.prevDeltaY, dragToss, velocityY, endOffsetY, steps);
            for (let i = 0; i < steps.length; i++) {
                const snapPoint = steps[i];
                const distFromSnap = Math.abs(snapPoint + endOffsetY);
                if (distFromSnap <= Math.abs(destSnapPoint + endOffsetY)) {
                    destSnapPoint = snapPoint;
                }
            }
            // if (destSnapPoint === 0) {
            //     this.$emit('');
            // }
            this.scrollSheetToPosition(destSnapPoint);
            this.prevDeltaY = 0;
        }
    }
    updateIsPanning(state: GestureState) {
        const viewTop = this.currentViewHeight - this.viewHeight;
        this.isPanning = state === GestureState.ACTIVE || state === GestureState.BEGAN;
        // if (this._isPanning) {

        // }

        // && viewTop !== -this.translationMaxOffset;
        // this.log('updateIsPanning', state, viewTop, this.translationMaxOffset, this._isPanning);
    }
    onGestureTouch(args: GestureTouchEventData) {
        const data = args.data;
        // this.log('onGestureTouch', this._isPanning, this.panEnabled, this.isAnimating, data.state, data.extraData.translationY, this.prevDeltaY);

        if (data.state !== GestureState.ACTIVE) {
            return;
        }
        const deltaY = data.extraData.translationY;
        if (this.isAnimating || !this._isPanning || !this.panEnabled) {
            this.prevDeltaY = deltaY;
            return;
        }

        const viewTop = this.currentViewHeight - this.viewHeight;

        const y = deltaY - this.prevDeltaY;
        // console.log('onPan', 'moving', viewTop, deltaY, this.prevDeltaY, y, this.translationMaxOffset);
        this.constrainY(viewTop + y);
        this.updateIsPanning(data.state);
        this.prevDeltaY = deltaY;
    }

    constrainY(y) {
        // console.log('constrainY', y, this.translationMaxOffset);
        let trY = y;
        if (y > 0) {
            trY = 0;
        } else if (y < -this.translationMaxOffset) {
            trY = -this.translationMaxOffset;
        }
        this.currentViewHeight = this.viewHeight + trY;
    }

    scrollSheetToPosition(position, duration = OPEN_DURATION) {
        const viewTop = this.currentViewHeight - this.viewHeight;
        this.log('scrollSheetToPosition', position, this.currentViewHeight, this.viewHeight);
        return new Promise(resolve => {
            this.log('scrollSheetToPosition2', position, viewTop);
            new Animation.Animation({ value: viewTop })
                .to({ value: -position }, duration)
                .easing(Animation.Easing.Quadratic.Out)
                .onUpdate(obj => {
                    this.currentViewHeight = this.viewHeight + obj.value;
                    // this.log('onUpdate', this.viewHeight, obj.value);
                })
                .onComplete(resolve)
                .onStop(resolve)
                .start();
            if (position !== 0) {
                this.opened = true;
                this.$emit('open');
            }
        }).then(() => {
            if (position === 0) {
                this.opened = false;
                this.$emit('close');
            }
        });
    }

    peek() {
        // if (!!this.opened) {
        //     return Promise.resolve();
        // }
        this.log('peek', this.opened);
        this.scrollSheetToPosition(this.peekerSteps[0]);
    }
    close() {
        this.log('close', this.opened);
        if (!this.opened) {
            return Promise.resolve();
        }
        this.scrollSheetToPosition(0, CLOSE_DURATION);
    }
}
