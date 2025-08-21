export default function parseImage(obj) {
  let listingImage
  let carouselImage
  if (obj._source) {
    listingImage = obj._source.image || obj._source.ftvaImage
    carouselImage = obj._source.imageCarousel || obj.imageCarousel
  } else {
    listingImage = obj.image || obj.ftvaImage
    carouselImage = obj.imageCarousel
  }

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
