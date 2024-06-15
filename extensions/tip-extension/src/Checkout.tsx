import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  BlockStack,
  useApplyCartLinesChange,
  useCartLines,
  Text,
  Checkbox,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState, Dispatch, SetStateAction } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

type ProductImage = {
  url: string;
};

type ProductVariant = {
  id: string;
  price: {
    amount: number;
  };
};

type Product = {
  id: string;
  title: string;
  images: {
    nodes: ProductImage[];
  };
  variants: {
    nodes: ProductVariant[];
  };
};

type ProductsResponse = {
  products: {
    nodes: Product[];
  };
};

function Extension() {
  const { query } = useApi();
  const { message, checkboxLabel, product_reference } = useSettings();
  const referenceID = (product_reference as string)?.toString().split("/");

  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();
  const [loading, setLoading] = useState(false);
  const [products, setProducts]: [
    Product[],
    Dispatch<SetStateAction<Product[]>>
  ] = useState<Product[]>([]);

  const addToCart = async (variantID: string) => {
    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantID,
      quantity: 1,
    });
    if (result.type === "success") {
      console.log(result.type);
    } else {
      console.log(result.message);
    }
  };

  const removeFromCart = async (merchandiseId: string) => {
    const result = await applyCartLinesChange({
      type: "updateCartLine",
      id: merchandiseId,
      quantity: 0,
    });
    if (result.type === "success") {
      console.log(result.type);
    } else {
      console.log(result.message);
    }
  };

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await query(
        `query {
          products(first: 100, query: "${referenceID[referenceID.length-1]}") {
            nodes {
              id
              title
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                  }
                }
              }
            }
          }
        }`,
        {
          variables: { first: 1 },
        }
      );
      // @ts-ignore
      setProducts(data?.products?.nodes);
      console.log(referenceID);
      // return data?.products?.nodes;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (checked: boolean) => {
    if (checked) {
      addToCart(products[0].variants.nodes[0].id);
    } else {
      const removableProduct = cartLines.filter(
        (line) => line.merchandise.id === products[0].variants.nodes[0].id
      );
      removeFromCart(removableProduct[0].id);
    }
    console.log(cartLines);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <BlockStack>
      <Checkbox onChange={handleChange} name="tip">
        {checkboxLabel ? checkboxLabel : "your Label Goes here"}
      </Checkbox>
      <Text>{message ? message : "Your message goes here"}</Text>
    </BlockStack>
  );
}
