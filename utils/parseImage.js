export default function parseImage(obj) {
  const listingImage = obj._source.image

  const carouselImage = obj._source.imageCarousel

  if (listingImage !== undefined && listingImage.length === 1) {
    // Use Listing Image
    return listingImage[0]
  } else if (carouselImage !== undefined && carouselImage.length >= 1) {
    // Use ImageCarousel
    return carouselImage[0].image[0]
  } else {
    return null
  }
}
