import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

export const ImageSlider = (props) => {
    const { settings, images } = props; 

    // const settings = {
        // dots: true,
        // infinite: true,
        // speed: 500,
        // slidesToShow: 1,
        // slidesToScroll: 1,
    // };

    return (
        <Slider {...settings}>
            {images}
        </Slider>
    )
};