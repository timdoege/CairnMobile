<template>
        <GridLayout ref="bottomSheet" backgroundColor="white" :rows="rows">
            <!-- <transition name="fade" duration="200"> -->
                <ListItem v-if="!!item" :showBottomLine="false" :avatar="item.image" :title=" item.name" :subtitle="item.excerpt" rightButton="mdi-chevron-right" @tap="showProfile(item)"/>
            <!-- </transition> -->

        </GridLayout>
</template>
<script lang="ts" src="./MapBottomSheet.ts"/>
