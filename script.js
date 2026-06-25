<script>
const products=[
{ name:"Milch",
  stock:0
},
{name:"Butter",
 stock:2
},
{name:"Kaffee",
stock:0
},
{name:"Zucker",
stock:0
}
];
const table=document.getElementById("productTable");
const shoppinglist=document.getElementById("shoppingList");
let missingProducts=0;
products.forEach(products=> {
	const row=document.createElement("tr");
	let status="";
	let statusClass="";
	if(product.stock===0) {
		status="Fehlt";
		statusClass="missing";
		missingProduct++;
		
		const item = document.createElement("li");
		item.textContent = product.name;
		soppingList.appendChild(item);
	}else{
		status="Vorhanden";
		statusClass="Oke"
	}
	
		
	






























	</script>