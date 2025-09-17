'use client';

import { useState } from 'react';
import { GalleryHero } from '@/components/customs/public/gallery/hero';
import { GalleryFilters } from '@/components/customs/public/gallery/gallery-filters';
import { GalleryGrid } from '@/components/customs/public/gallery/gallery-grid';
import { GalleryLightbox } from '@/components/customs/public/gallery/gallery-lightbox';
import { StructuredData } from '@/components/seo/structured-data';

const galleryImages = [
	{
		src: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
		alt: 'Poulet moambé traditionnel - Spécialité restaurant africain Brazzaville',
		category: 'Plats',
		title: 'Poulet Moambé',
		description: 'Notre spécialité signature préparée selon la tradition congolaise',
	},
	{
		src: 'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
		alt: 'Poisson grillé aux épices africaines - Cuisine locale Congo',
		category: 'Plats',
		title: 'Poisson Grillé',
		description: 'Poisson frais grillé aux épices locales',
	},
	{
		src: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
		alt: 'Légumes traditionnels africains - Restaurant Resto_Congo',
		category: 'Plats',
		title: 'Saka-Saka',
		description: 'Feuilles de manioc à la sauce d\'arachide',
	},
	{
		src: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg',
		alt: 'Intérieur restaurant africain Brazzaville - Ambiance chaleureuse',
		category: 'Restaurant',
		title: 'Salle Principale',
		description: 'Notre salle à manger avec décoration africaine authentique',
	},
	{
		src: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg',
		alt: 'Salle à manger traditionnelle - Restaurant africain Brazzaville',
		category: 'Restaurant',
		title: 'Espace VIP',
		description: 'Salon privé pour vos événements spéciaux',
	},
	{
		src: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
		alt: 'Épices et condiments africains - Cuisine authentique Congo',
		category: 'Ingrédients',
		title: 'Épices Locales',
		description: 'Sélection d\'épices traditionnelles du Congo',
	},
	{
		src: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg',
		alt: 'Préparation plats traditionnels - Chef restaurant africain',
		category: 'Cuisine',
		title: 'En Cuisine',
		description: 'Nos chefs préparent vos plats avec passion',
	},
	{
		src: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
		alt: 'Fruits tropicaux frais - Ingrédients cuisine africaine',
		category: 'Ingrédients',
		title: 'Fruits Tropicaux',
		description: 'Fruits frais du marché local de Brazzaville',
	},
	{
		src: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg',
		alt: 'Ambiance conviviale restaurant - Saveurs d\'Afrique Brazzaville',
		category: 'Restaurant',
		title: 'Terrasse',
		description: 'Notre terrasse pour profiter du climat tropical',
	},
	{
		src: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg',
		alt: 'Viande grillée africaine - Spécialités restaurant Brazzaville',
		category: 'Plats',
		title: 'Viande Grillée',
		description: 'Viande de qualité grillée aux herbes africaines',
	},
	{
		src: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
		alt: 'Plat traditionnel Congo - Cuisine authentique Brazzaville',
		category: 'Plats',
		title: 'Cabri Grillé',
		description: 'Spécialité de viande de chèvre aux épices',
	},
	{
		src: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
		alt: 'Équipe cuisine restaurant africain - Chefs Saveurs d\'Afrique',
		category: 'Équipe',
		title: 'Notre Équipe',
		description: 'L\'équipe passionnée de Saveurs d\'Afrique',
	},
];

const categories = ['Tous', 'Plats', 'Restaurant', 'Ingrédients', 'Cuisine', 'Équipe'];

export default function Gallery() {
	const [selectedCategory, setSelectedCategory] = useState('Tous');
	const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('category');

	const filteredImages = galleryImages.filter((img) => {
		const matchesCategory = selectedCategory === 'Tous' || img.category === selectedCategory;
		const matchesSearch =
			img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			img.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			img.alt.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	const sortedImages = [...filteredImages].sort((a, b) => {
		switch (sortBy) {
			case 'title':
				return a.title.localeCompare(b.title);
			case 'category':
			default:
				return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
		}
	});

	const nextImage = () => {
		if (!selectedImage) return;
		const currentIndex = sortedImages.findIndex((img) => img.src === selectedImage.src);
		const nextIndex = (currentIndex + 1) % sortedImages.length;
		setSelectedImage(sortedImages[nextIndex]);
	};

	const prevImage = () => {
		if (!selectedImage) return;
		const currentIndex = sortedImages.findIndex((img) => img.src === selectedImage.src);
		const prevIndex = (currentIndex - 1 + sortedImages.length) % sortedImages.length;
		setSelectedImage(sortedImages[prevIndex]);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<StructuredData type="restaurant" />
			<GalleryHero />

			{/* Gallery Section */}
			<section id="gallery-content" className="py-12 sm:py-16 lg:py-20 bg-white">
				<div className="w-full px-4 sm:px-6 lg:px-8">
					<div className="max-w-7xl mx-auto">
						<GalleryFilters
							searchTerm={searchTerm}
							onSearchChange={setSearchTerm}
							sortBy={sortBy}
							onSortChange={setSortBy}
							viewMode={viewMode}
							onViewModeChange={setViewMode}
							selectedCategory={selectedCategory}
							onCategoryChange={setSelectedCategory}
							categories={categories}
						/>

						<GalleryGrid
							images={sortedImages}
							viewMode={viewMode}
							onImageClick={setSelectedImage}
						/>

						<GalleryLightbox
							image={selectedImage}
							onClose={() => setSelectedImage(null)}
							onNext={nextImage}
							onPrev={prevImage}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}