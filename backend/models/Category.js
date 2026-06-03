import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    image: {
      type: String,
      required: [true, 'Please provide a category image URL']
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to create slugs from names
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
