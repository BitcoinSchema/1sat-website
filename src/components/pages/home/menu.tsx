import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const Menu = () => {
	return (
		<div className="mb-8">
			<ButtonGroup>
				<Button variant="secondary" size="sm" asChild>
					<Link href="/market/ordinals">Ordinals</Link>
				</Button>
				<Button variant="secondary" size="sm" asChild>
					<Link href="/market/bsv20">BSV20</Link>
				</Button>
				<Button variant="secondary" size="sm" asChild>
					<Link href="/market/bsv21">BSV21</Link>
				</Button>
			</ButtonGroup>
		</div>
	);
};

export default Menu;
