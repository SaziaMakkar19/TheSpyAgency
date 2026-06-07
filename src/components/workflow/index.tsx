'use client'

import React from 'react'
import { Grid, Box } from '@/components/layout'
import { CurveLine } from '@/components/icons/curve-line'
import { User } from '@/components/icons/user'
import { UpArrow } from '@/components/icons/up-arrow'
import { Hyperlink } from '@/components/icons/hyperlink'
import { storeFile } from '@/data/landing-data'
import { Text } from 'rizzui'

const Icons = {
    User,
    UpArrow,
    Hyperlink,
}

type IconType = keyof typeof Icons

export function Workflow() {
    return (
        <section className="w-full bg-white py-16 md:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Visual Top Divider Accent */}
                <div className="w-14 h-1 bg-blue-500 mx-auto rounded-full mb-6" />

                {/* Section Header */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display max-w-2xl mx-auto mb-4">
                    The Easiest Way To Make Your Listing Go Viral
                </h2>
                <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed mb-20 font-body">
                    Start campaign, select office colleagues and local agents,
                    define campaign, approve assets, schedule posts and blanket
                    local market.
                </p>

                {/* 3-Step Grid Interface Container */}
                <Grid className="[@media(min-width:500px)]:grid-cols-2 md:!grid-cols-3 gap-4 lg:gap-6 relative ">
                    <CurveLine className="absolute z-[1] hidden xl:block w-[calc(100%-28rem)] h-auto top-12 left-1/2 -translate-x-1/2" />
                    {storeFile.map((card, idx) => (
                        <Card key={`store-file-card-${idx}`} {...card} />
                    ))}
                </Grid>
            </div>
        </section>
    )
}

function Card(props: {
    title: string
    description: string
    icon: string
    color: string
    shadowColor: string
}) {
    const Icon = Icons[props.icon as IconType]
    return (
        <Box
            style={
                {
                    '--color': props.color,
                    '--shadow-color': props.shadowColor,
                } as React.CSSProperties
            }
            className="p-4 lg:p-10 flex flex-col items-center card"
        >
            <Box className="rounded-2xl lg:rounded-3xl relative z-10 bg-[var(--color)] mb-4 lg:mb-12 w-[50px] h-[50px] lg:w-20 lg:h-20 shadow-[0_4px_80px_var(--shadow-color)]">
                <Icon className="w-full h-auto" />
            </Box>
            <Text className="lg:text-2xl md:text-xl lg:leading-[38px] font-semibold mb-2 md:mb-3 lg:mb-4 text-custom-black">
                {props.title}
            </Text>
            <Text className="text-[#475569] text-center max-w-[30ch] lg:max-w-[28ch] md:text-base text-sm">
                {props.description}
            </Text>
        </Box>
    )
}
